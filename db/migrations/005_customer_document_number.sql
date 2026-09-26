ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS document_number TEXT;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_document_number_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_document_number_check CHECK (
    document_number IS NULL OR (
      char_length(document_number) BETWEEN 3 AND 40
      AND document_number = btrim(document_number)
      AND document_number !~ '[[:cntrl:]]'
    )
  );
