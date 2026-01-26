-- Create storage bucket for occurrence photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocorrencias-fotos', 'ocorrencias-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ocorrencias-fotos');

-- Allow public read access to photos
CREATE POLICY "Public can view photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'ocorrencias-fotos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'ocorrencias-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);
