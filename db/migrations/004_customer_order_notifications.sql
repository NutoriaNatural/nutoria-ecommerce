ALTER TABLE notification_jobs
  DROP CONSTRAINT IF EXISTS notification_jobs_notification_type_check,
  DROP CONSTRAINT IF EXISTS notification_jobs_channel_check;

ALTER TABLE notification_jobs
  ADD CONSTRAINT notification_jobs_notification_type_check
    CHECK (notification_type IN (
      'payment_approved',
      'customer_order_confirmed',
      'customer_preparing',
      'customer_dispatched',
      'customer_delivered',
      'customer_cancelled'
    )),
  ADD CONSTRAINT notification_jobs_channel_check
    CHECK (channel IN ('email', 'whatsapp', 'customer_email'));

INSERT INTO notification_jobs (order_id, notification_type, channel)
SELECT id, 'customer_order_confirmed', 'customer_email'
FROM orders
WHERE payment_status = 'approved'
ON CONFLICT (order_id, notification_type, channel) DO NOTHING;
