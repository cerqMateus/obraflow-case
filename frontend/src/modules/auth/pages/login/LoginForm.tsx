import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ApiError } from '../../../../shared/api-client';
import { Button } from '../../../../shared/components/ui/button';
import { Input } from '../../../../shared/components/ui/input';
import { useSession } from '../../SessionProvider';
import { loginSchema } from '../../session-service';
import type { LoginInput } from '../../session-service';

export const LoginForm = () => {
  const { login, retry } = useSession();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>();
  const messageRef = useRef<HTMLParagraphElement>(null);
  const submitting = useRef(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), mode: 'onBlur', defaultValues: { email: '', password: '' },
  });
  const submit = async (input: LoginInput): Promise<void> => {
    if (submitting.current) return;
    submitting.current = true;
    setMessage(undefined);
    try { await login(input); }
    catch (error) {
      if (error instanceof ApiError && error.code === 'SESSION_ALREADY_AUTHENTICATED') retry();
      setMessage(error instanceof ApiError && error.code === 'INVALID_CREDENTIALS'
        ? 'E-mail ou senha inválidos. Confira os dados e tente novamente.'
        : error instanceof ApiError && error.code === 'LOGIN_RATE_LIMITED'
          ? 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'
          : 'Não foi possível confirmar sua entrada. Tente novamente para consultar a sessão antes de reenviar.');
      window.setTimeout(() => messageRef.current?.focus(), 0);
    } finally { submitting.current = false; }
  };
  return <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6" aria-busy={isSubmitting}>
    <div className="space-y-2">
      <label htmlFor="email" className="block text-sm font-semibold">E-mail</label>
      <Input id="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
        aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
      {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
    </div>
    <div className="space-y-2">
      <label htmlFor="password" className="block text-sm font-semibold">Senha</label>
      <div className="relative">
        <Input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" className="pr-14"
          aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} />
        <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible}
          onClick={() => setVisible(!visible)} className="absolute right-0.5 top-0.5 flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
          {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
      </div>
      {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>}
    </div>
    {message && <p ref={messageRef} tabIndex={-1} role="alert" className="rounded-lg bg-muted p-3 text-sm leading-6 text-destructive">{message}</p>}
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? 'Entrando…' : 'Entrar'} <ArrowRight size={18} aria-hidden="true" />
    </Button>
    <p role="status" className="sr-only">{isSubmitting ? 'Verificando suas credenciais.' : ''}</p>
  </form>;
};
