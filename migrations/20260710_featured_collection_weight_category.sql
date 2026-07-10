BEGIN;

-- Featured collection priority values (-2..2) do not map cleanly to the new
-- decimal weight semantics. Existing records are intentionally backfilled with
-- the neutral/default weight of 1 and a blank category.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'featured_collections'
          AND table_schema = ANY (current_schemas(false))
          AND column_name = 'tags'
    ) THEN
        ALTER TABLE featured_collections ADD COLUMN tags JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'featured_collections'
          AND table_schema = ANY (current_schemas(false))
          AND column_name = 'weight'
    ) THEN
        ALTER TABLE featured_collections ADD COLUMN weight NUMERIC(10,4);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'featured_collections'
          AND table_schema = ANY (current_schemas(false))
          AND column_name = 'category'
    ) THEN
        ALTER TABLE featured_collections ADD COLUMN category VARCHAR(120);
    END IF;
END $$;

UPDATE featured_collections
SET tags = '["all"]'::jsonb
WHERE tags IS NULL
   OR jsonb_typeof(tags) IS DISTINCT FROM 'array';

UPDATE featured_collections
SET tags = '["all"]'::jsonb
WHERE jsonb_typeof(tags) = 'array'
  AND jsonb_array_length(tags) = 0;

ALTER TABLE featured_collections
    ALTER COLUMN tags SET DEFAULT '["all"]'::jsonb,
    ALTER COLUMN tags SET NOT NULL;

UPDATE featured_collections
SET weight = 1
WHERE weight IS NULL
   OR weight <= 0
   OR weight > 100;

ALTER TABLE featured_collections
    ALTER COLUMN weight SET DEFAULT 1,
    ALTER COLUMN weight SET NOT NULL;

UPDATE featured_collections
SET category = LEFT(REGEXP_REPLACE(BTRIM(COALESCE(category, '')), '[[:cntrl:]]', '', 'g'), 120)
WHERE category IS NULL
   OR category <> LEFT(REGEXP_REPLACE(BTRIM(COALESCE(category, '')), '[[:cntrl:]]', '', 'g'), 120);

ALTER TABLE featured_collections
    ALTER COLUMN category SET DEFAULT '',
    ALTER COLUMN category SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'featured_collections_weight_range_chk'
    ) THEN
        ALTER TABLE featured_collections
            ADD CONSTRAINT featured_collections_weight_range_chk
            CHECK (weight > 0 AND weight <= 100);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'featured_collections'
          AND table_schema = ANY (current_schemas(false))
          AND column_name = 'priority'
    ) THEN
        ALTER TABLE featured_collections DROP COLUMN priority;
    END IF;
END $$;

COMMIT;
