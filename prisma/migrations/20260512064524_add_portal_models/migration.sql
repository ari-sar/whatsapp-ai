-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "access_token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN     "flow_id" TEXT,
ALTER COLUMN "response_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "collected_data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "current_flow_id" TEXT,
ADD COLUMN     "current_step" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "business_name" TEXT,
    "business_type_id" TEXT,
    "plan_id" TEXT,
    "is_onboarded" BOOLEAN NOT NULL DEFAULT false,
    "client_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_in_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billing_cycle" TEXT NOT NULL,
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessFlow" (
    "id" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "step_count" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BusinessFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKeyword" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "response_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_client_id_key" ON "User"("client_id");

-- CreateIndex
CREATE INDEX "OtpRequest_phone_created_at_idx" ON "OtpRequest"("phone", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserKeyword_user_id_trigger_key" ON "UserKeyword"("user_id", "trigger");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_razorpay_order_id_key" ON "PaymentOrder"("razorpay_order_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKeyword" ADD CONSTRAINT "UserKeyword_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
