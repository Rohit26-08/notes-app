-- AddColumn description
ALTER TABLE "Goal" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

-- DropColumn done
ALTER TABLE "Goal" DROP COLUMN "done";

-- CreateTable
CREATE TABLE "GoalCheck" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GoalCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalCheck_goalId_day_key" ON "GoalCheck"("goalId", "day");

-- AddForeignKey
ALTER TABLE "GoalCheck" ADD CONSTRAINT "GoalCheck_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
