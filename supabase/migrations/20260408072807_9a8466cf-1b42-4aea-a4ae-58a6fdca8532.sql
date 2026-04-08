
-- Allow anonymous users (phone scanning QR) to insert/update kv_store for QR scan entries
CREATE POLICY "Anon can write qr_scan entries"
ON public.kv_store_62d2b480
FOR ALL
TO anon
USING (key LIKE 'qr_scan_%')
WITH CHECK (key LIKE 'qr_scan_%');
