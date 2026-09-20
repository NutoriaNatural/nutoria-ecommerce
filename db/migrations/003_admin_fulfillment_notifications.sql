ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CHECK (fulfillment_status IN (
      'awaiting_payment', 'ready_to_prepare', 'preparing',
      'dispatched', 'delivered', 'cancelled'
    )),
  ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

UPDATE orders
SET fulfillment_status = CASE
  WHEN payment_status = 'approved' THEN 'ready_to_prepare'
  WHEN payment_status IN ('declined', 'voided', 'error') THEN 'cancelled'
  ELSE 'awaiting_payment'
END
WHERE fulfillment_status = 'awaiting_payment';

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fulfillment_status TEXT NOT NULL CHECK (fulfillment_status IN (
    'awaiting_payment', 'ready_to_prepare', 'preparing',
    'dispatched', 'delivered', 'cancelled'
  )),
  notes TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx
  ON order_status_history(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'payment_approved'
    CHECK (notification_type = 'payment_approved'),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_message_id TEXT,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, notification_type, channel)
);

CREATE INDEX IF NOT EXISTS notification_jobs_pending_idx
  ON notification_jobs(status, next_attempt_at)
  WHERE status IN ('pending', 'failed');
