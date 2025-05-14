/*
  Warnings:

  - You are about to drop the column `serviceName` on the `Ticket` table. All the data in the column will be lost.
  - You are about to alter the column `waitTime` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `department` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_departmentId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "serviceName",
ADD COLUMN     "assignedAgentId" TEXT,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "service" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'normal',
ALTER COLUMN "priority" SET DATA TYPE TEXT,
ALTER COLUMN "waitTime" SET DEFAULT 0,
ALTER COLUMN "waitTime" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" TEXT DEFAULT 'offline',
ALTER COLUMN "role" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Agent_departmentId_idx" ON "Agent"("departmentId");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_assignedAgentId_idx" ON "Ticket"("assignedAgentId");

-- CreateIndex
CREATE INDEX "Ticket_departmentId_idx" ON "Ticket"("departmentId");

-- CreateIndex
CREATE INDEX "Ticket_agentId_idx" ON "Ticket"("agentId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
