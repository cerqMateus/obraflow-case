-- Prisma cannot represent these check constraints or the partial unique index.
CREATE UNIQUE INDEX "responsibility_one_active" ON "ProjectResponsibility" ("projectId", "operatorId") WHERE active;

ALTER TABLE "User" ADD CONSTRAINT "user_normalized_email" CHECK (email = lower(btrim(email)) AND length(email) > 0);
ALTER TABLE "User" ADD CONSTRAINT "user_nonblank_name" CHECK (length(btrim(name)) > 0);
ALTER TABLE "Project" ADD CONSTRAINT "project_valid" CHECK ("rulesRevision" >= 0 AND length(btrim(name)) > 0);
ALTER TABLE "Supplier" ADD CONSTRAINT "supplier_nonblank_name" CHECK (length(btrim(name)) > 0);
ALTER TABLE "ProjectResponsibility" ADD CONSTRAINT "responsibility_revocation" CHECK (
  (active AND "revokedAt" IS NULL AND "revokedById" IS NULL) OR
  (NOT active AND "revokedAt" IS NOT NULL AND "revokedById" IS NOT NULL AND "revokedAt" >= "grantedAt")
);
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "rule_bounds" CHECK (
  ("lowerExclusive" IS NULL OR "lowerExclusive" >= 0) AND
  ("upperInclusive" IS NULL OR "upperInclusive" >= 0) AND
  ("lowerExclusive" IS NULL OR "upperInclusive" IS NULL OR "lowerExclusive" < "upperInclusive")
);
ALTER TABLE "RuleStep" ADD CONSTRAINT "rule_step_position" CHECK (position BETWEEN 1 AND 20);
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "order_valid" CHECK (
  total >= 0 AND version >= 1 AND "rulesRevisionSnapshot" >= 0 AND
  ("lowerSnapshot" IS NULL OR "lowerSnapshot" >= 0) AND
  ("upperSnapshot" IS NULL OR "upperSnapshot" >= 0) AND
  ("lowerSnapshot" IS NULL OR "upperSnapshot" IS NULL OR "lowerSnapshot" < "upperSnapshot") AND
  ((status = 'pending' AND "currentStepPosition" BETWEEN 1 AND 20 AND "currentStepPosition" IS NOT NULL) OR
   (status <> 'pending' AND "currentStepPosition" IS NULL)) AND
  length(btrim("projectNameSnapshot")) > 0 AND length(btrim("supplierNameSnapshot")) > 0
);
ALTER TABLE "OrderItem" ADD CONSTRAINT "item_valid" CHECK (
  position BETWEEN 1 AND 100 AND quantity > 0 AND "unitPrice" >= 0 AND total >= 0 AND
  length(btrim(description)) > 0 AND length(btrim(unit)) > 0
);
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "step_valid_decision" CHECK (
  position BETWEEN 1 AND 20 AND length(btrim("operatorNameSnapshot")) > 0 AND (
    (status IN ('waiting', 'pending', 'skipped') AND "decidedById" IS NULL AND "decidedAt" IS NULL AND "rejectionReason" IS NULL) OR
    (status = 'approved' AND "decidedById" IS NOT NULL AND "decidedById" = "assignedOperatorId" AND "decidedAt" IS NOT NULL AND "rejectionReason" IS NULL) OR
    (status = 'rejected' AND "decidedById" IS NOT NULL AND "decidedById" = "assignedOperatorId" AND "decidedAt" IS NOT NULL AND "rejectionReason" IS NOT NULL AND length(btrim("rejectionReason")) > 0)
  )
);

-- Cross-row eligibility, same-project membership, overlap, totals and complete
-- chains are validated under the project lock by the future domain use cases.
-- NUMERIC rejects overflow but rounds extra scale; HTTP must reject extra scale
-- before conversion. A database typmod cannot recover the original input scale.
