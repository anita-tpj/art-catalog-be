-- Add slug as nullable first
ALTER TABLE "Artist"
ADD COLUMN "slug" TEXT;
-- Generate slugs for all existing artists.
-- row_number() makes duplicate names unique:
-- ana-petrovic
-- ana-petrovic-2
-- ana-petrovic-3
WITH generated_slugs AS (
  SELECT "id",
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            "name",
            'čćžšđČĆŽŠĐ',
            'cczsdCCZSD'
          )
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '(^-|-$)',
      '',
      'g'
    ) AS base_slug
  FROM "Artist"
),
unique_slugs AS (
  SELECT "id",
    base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY base_slug
      ORDER BY "id"
    ) AS slug_number
  FROM generated_slugs
)
UPDATE "Artist" AS artist
SET "slug" = CASE
    WHEN unique_slugs.slug_number = 1 THEN unique_slugs.base_slug
    ELSE unique_slugs.base_slug || '-' || unique_slugs.slug_number
  END
FROM unique_slugs
WHERE artist."id" = unique_slugs."id";
-- Slug is required after existing data has been backfilled
ALTER TABLE "Artist"
ALTER COLUMN "slug"
SET NOT NULL;
-- Slugs must be unique
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");