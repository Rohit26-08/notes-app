-- Clear old rows that have no userId, then add the column
DELETE FROM "DayNote";
DELETE FROM "Draft";

-- Drop old unique constraint on DayNote.date
ALTER TABLE "DayNote" DROP CONSTRAINT IF EXISTS "DayNote_date_key";

-- AddColumn userId
ALTER TABLE "DayNote" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Draft" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';

-- Remove the temporary default
ALTER TABLE "DayNote" ALTER COLUMN "userId" DROP DEFAULT;
ALTER TABLE "Draft" ALTER COLUMN "userId" DROP DEFAULT;

-- New composite unique
ALTER TABLE "DayNote" ADD CONSTRAINT "DayNote_date_userId_key" UNIQUE ("date", "userId");
