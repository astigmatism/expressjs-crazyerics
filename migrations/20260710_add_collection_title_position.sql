BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'collections_titles'
          AND table_schema = ANY (current_schemas(false))
          AND column_name = 'position'
    ) THEN
        ALTER TABLE collections_titles ADD COLUMN position INTEGER;
    END IF;
END $$;

WITH ranked AS (
    SELECT
        ctid,
        ROW_NUMBER() OVER (
            PARTITION BY collection_id
            ORDER BY position NULLS LAST, ctid
        ) - 1 AS rn
    FROM collections_titles
)
UPDATE collections_titles ct
SET position = ranked.rn
FROM ranked
WHERE ct.ctid = ranked.ctid
  AND ct.position IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'i'
          AND relname = 'collections_titles_collection_position_idx'
    ) THEN
        CREATE INDEX collections_titles_collection_position_idx
            ON collections_titles (collection_id, position);
    END IF;
END $$;

COMMIT;
