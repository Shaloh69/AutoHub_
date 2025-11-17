-- Check current QR code URL in database
SELECT setting_key, setting_value
FROM payment_settings
WHERE setting_key = 'payment_qr_code_image';
