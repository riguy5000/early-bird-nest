
-- Create storage bucket for batch photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('batch-photos', 'batch-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read batch photos (public bucket)
CREATE POLICY "Public read access for batch photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'batch-photos');

-- Allow authenticated and anon to upload batch photos
CREATE POLICY "Allow upload batch photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'batch-photos');

-- Allow delete batch photos
CREATE POLICY "Allow delete batch photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'batch-photos');
