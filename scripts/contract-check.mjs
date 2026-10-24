import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const checkContract = async (input) => {
  const document = await SwaggerParser.validate(structuredClone(input), {
    resolve: { external: false }, dereference: { circular: false },
  });
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: true });
  addFormats(ajv);
  const ids = new Set();
  let examples = 0;
  const validateExample = (schema, value, path) => {
    const validate = ajv.compile(schema);
    if (!validate(value)) throw new Error(`${path}: ${ajv.errorsText(validate.errors)}`);
    examples++;
  };
  const visit = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if ('$ref' in node) throw new Error(`${path}: unresolved reference`);
    if (node.schema) {
      if ('example' in node) validateExample(node.schema, node.example, `${path}.example`);
      for (const [name, example] of Object.entries(node.examples ?? {})) {
        if (!('value' in example)) throw new Error(`${path}.${name}: external examples are not supported`);
        validateExample(node.schema, example.value, `${path}.examples.${name}`);
      }
    } else if ('example' in node && (node.type || node.allOf || node.oneOf || node.anyOf)) {
      validateExample(node, node.example, `${path}.example`);
    }
    for (const [key, child] of Object.entries(node)) {
      if (!['example', 'examples', 'default', 'enum'].includes(key)) visit(child, `${path}.${key}`);
    }
  };
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of methods) {
      const operation = item[method];
      if (!operation) continue;
      if (!operation.operationId || ids.has(operation.operationId)) {
        throw new Error(`${method} ${path}: missing or duplicate operationId`);
      }
      ids.add(operation.operationId);
    }
  }
  visit(document, '$');
  return { operations: ids.size, examples };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const input = JSON.parse(readFileSync(new URL('../docs/openapi.json', import.meta.url), 'utf8'));
    const result = await checkContract(input);
    console.log(`OpenAPI válido: ${result.operations} operações planejadas, ${result.examples} exemplos. Não comprova implementação.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Contrato inválido.');
    process.exitCode = 1;
  }
}
