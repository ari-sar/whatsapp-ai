-- CreateTable
CREATE TABLE "ServiceablePincode" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceablePincode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceablePincode_client_id_idx" ON "ServiceablePincode"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceablePincode_client_id_pincode_key" ON "ServiceablePincode"("client_id", "pincode");

-- AddForeignKey
ALTER TABLE "ServiceablePincode" ADD CONSTRAINT "ServiceablePincode_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
