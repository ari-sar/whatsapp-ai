-- AlterTable
ALTER TABLE "BusinessFlow" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "initial_step_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "description" TEXT,
ADD COLUMN     "discount_amount" INTEGER,
ADD COLUMN     "discount_days" INTEGER,
ADD COLUMN     "duration_days" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan_expires_at" TIMESTAMP(3),
ADD COLUMN     "plan_started_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FlowStep" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "transitions" JSONB NOT NULL DEFAULT '[]',
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminOtpRequest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminOtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "admin_phone_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowStep_flow_id_step_id_key" ON "FlowStep"("flow_id", "step_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPhone_phone_key" ON "AdminPhone"("phone");

-- CreateIndex
CREATE INDEX "AdminOtpRequest_phone_created_at_idx" ON "AdminOtpRequest"("phone", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_admin_phone_id_idx" ON "AdminSession"("admin_phone_id");

-- AddForeignKey
ALTER TABLE "FlowStep" ADD CONSTRAINT "FlowStep_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "BusinessFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_admin_phone_id_fkey" FOREIGN KEY ("admin_phone_id") REFERENCES "AdminPhone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
