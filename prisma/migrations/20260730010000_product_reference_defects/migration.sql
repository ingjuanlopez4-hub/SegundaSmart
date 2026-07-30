PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "defects" TEXT,
    "description" TEXT NOT NULL,
    "photoPath" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "suggestedCents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK ("status" IN ('AVAILABLE', 'SOLD')),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Product" (
    "id", "businessId", "reference", "name", "category", "condition", "defects",
    "description", "photoPath", "costCents", "priceCents", "suggestedCents", "status", "createdAt", "updatedAt"
)
SELECT
    "id", "businessId", 'PZ-' || UPPER("id"), "name", "category", "condition", NULL,
    "description", "photoPath", "costCents", "priceCents", "suggestedCents", "status", "createdAt", "updatedAt"
FROM "Product";

DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";

CREATE INDEX "Product_businessId_status_idx" ON "Product"("businessId", "status");
CREATE INDEX "Product_businessId_createdAt_idx" ON "Product"("businessId", "createdAt");
CREATE UNIQUE INDEX "Product_businessId_reference_key" ON "Product"("businessId", "reference");

PRAGMA foreign_keys=ON;
