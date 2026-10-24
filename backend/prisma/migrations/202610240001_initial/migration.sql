CREATE SEQUENCE purchase_order_reference_seq;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'operator');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('waiting', 'pending', 'approved', 'rejected', 'skipped');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "rulesRevision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectResponsibility" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "operatorId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "grantedById" UUID NOT NULL,
    "grantedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedById" UUID,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProjectResponsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRule" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "lowerExclusive" DECIMAL(18,2),
    "upperInclusive" DECIMAL(18,2),

    CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleStep" (
    "id" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "responsibilityId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RuleStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(40) NOT NULL DEFAULT ('PO-'::text || nextval('purchase_order_reference_seq'::regclass)::text),
    "projectId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "sourceRuleId" UUID,
    "rulesRevisionSnapshot" INTEGER NOT NULL,
    "lowerSnapshot" DECIMAL(18,2),
    "upperSnapshot" DECIMAL(18,2),
    "projectNameSnapshot" VARCHAR(120) NOT NULL,
    "supplierNameSnapshot" VARCHAR(160) NOT NULL,
    "orderDate" DATE NOT NULL,
    "notes" VARCHAR(2000),
    "total" DECIMAL(18,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "currentStepPosition" INTEGER DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(9,3) NOT NULL,
    "unit" VARCHAR(10) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "responsibilityId" UUID NOT NULL,
    "assignedOperatorId" UUID NOT NULL,
    "operatorNameSnapshot" VARCHAR(120) NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "StepStatus" NOT NULL,
    "decidedById" UUID,
    "decidedAt" TIMESTAMPTZ(3),
    "rejectionReason" VARCHAR(1000),

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- CreateIndex
CREATE INDEX "ProjectResponsibility_projectId_active_idx" ON "ProjectResponsibility"("projectId", "active");

-- CreateIndex
CREATE INDEX "ProjectResponsibility_operatorId_active_idx" ON "ProjectResponsibility"("operatorId", "active");

-- CreateIndex
CREATE INDEX "ApprovalRule_projectId_idx" ON "ApprovalRule"("projectId");

-- CreateIndex
CREATE INDEX "RuleStep_responsibilityId_idx" ON "RuleStep"("responsibilityId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleStep_ruleId_position_key" ON "RuleStep"("ruleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RuleStep_ruleId_responsibilityId_key" ON "RuleStep"("ruleId", "responsibilityId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_reference_key" ON "PurchaseOrder"("reference");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_createdAt_id_idx" ON "PurchaseOrder"("projectId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_requesterId_createdAt_id_idx" ON "PurchaseOrder"("requesterId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_createdAt_id_idx" ON "PurchaseOrder"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_sourceRuleId_idx" ON "PurchaseOrder"("sourceRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_position_key" ON "OrderItem"("orderId", "position");

-- CreateIndex
CREATE INDEX "ApprovalStep_assignedOperatorId_orderId_idx" ON "ApprovalStep"("assignedOperatorId", "orderId");

-- CreateIndex
CREATE INDEX "ApprovalStep_responsibilityId_status_idx" ON "ApprovalStep"("responsibilityId", "status");

-- CreateIndex
CREATE INDEX "ApprovalStep_decidedById_idx" ON "ApprovalStep"("decidedById");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_orderId_position_key" ON "ApprovalStep"("orderId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_orderId_assignedOperatorId_key" ON "ApprovalStep"("orderId", "assignedOperatorId");

-- AddForeignKey
ALTER TABLE "ProjectResponsibility" ADD CONSTRAINT "ProjectResponsibility_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResponsibility" ADD CONSTRAINT "ProjectResponsibility_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResponsibility" ADD CONSTRAINT "ProjectResponsibility_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResponsibility" ADD CONSTRAINT "ProjectResponsibility_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleStep" ADD CONSTRAINT "RuleStep_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleStep" ADD CONSTRAINT "RuleStep_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "ProjectResponsibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_sourceRuleId_fkey" FOREIGN KEY ("sourceRuleId") REFERENCES "ApprovalRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "ProjectResponsibility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

