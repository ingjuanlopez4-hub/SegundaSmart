CREATE TABLE "BusinessOwnership" (
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "requestKey" TEXT,
    PRIMARY KEY ("userId", "businessId"),
    CONSTRAINT "BusinessOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessOwnership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "BusinessOwnership" ("userId", "businessId") SELECT "id", "businessId" FROM "User";

CREATE UNIQUE INDEX "BusinessOwnership_userId_requestKey_key" ON "BusinessOwnership"("userId", "requestKey");
CREATE INDEX "BusinessOwnership_businessId_idx" ON "BusinessOwnership"("businessId");
