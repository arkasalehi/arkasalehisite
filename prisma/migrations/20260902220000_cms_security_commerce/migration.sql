-- CMS
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
ALTER TABLE "RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notifications grouping
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "groupKey" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "count" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "Notification_userId_groupKey_read_idx" ON "Notification"("userId", "groupKey", "read");

-- Product stock / discount
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER NOT NULL DEFAULT 0;
UPDATE "Product" SET "stock" = 100 WHERE "stock" = 0 AND "inStock" = true;

-- Extra post indexes
CREATE INDEX IF NOT EXISTS "Post_status_viewCount_idx" ON "Post"("status", "viewCount");
CREATE INDEX IF NOT EXISTS "Post_title_idx" ON "Post"("title");
