CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  checkout_fingerprint TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  order_status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (order_status IN ('pending_payment', 'confirmed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'approved', 'declined', 'voided', 'error')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_address_detail TEXT NOT NULL DEFAULT '',
  shipping_city TEXT NOT NULL,
  shipping_region TEXT NOT NULL,
  shipping_country CHAR(2) NOT NULL DEFAULT 'CO' CHECK (shipping_country = 'CO'),
  currency CHAR(3) NOT NULL DEFAULT 'COP' CHECK (currency = 'COP'),
  subtotal_in_cents BIGINT NOT NULL CHECK (subtotal_in_cents >= 0),
  shipping_in_cents BIGINT NOT NULL CHECK (shipping_in_cents >= 0),
  total_in_cents BIGINT NOT NULL CHECK (
    total_in_cents = subtotal_in_cents + shipping_in_cents
  ),
  wompi_transaction_id TEXT UNIQUE,
  wompi_payment_method_type TEXT,
  wompi_status_updated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  presentation TEXT NOT NULL DEFAULT '',
  unit_price_in_cents BIGINT NOT NULL CHECK (unit_price_in_cents >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_in_cents BIGINT NOT NULL CHECK (
    line_total_in_cents = unit_price_in_cents * quantity
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'wompi' CHECK (provider = 'wompi'),
  event_checksum TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('test', 'prod')),
  wompi_transaction_id TEXT,
  reference TEXT,
  payment_status TEXT,
  amount_in_cents BIGINT,
  currency TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_transaction_status_idx
  ON payment_events(wompi_transaction_id, payment_status)
  WHERE wompi_transaction_id IS NOT NULL AND payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_events_reference_idx ON payment_events(reference);
