CREATE POLICY "Users can upload own company logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'company-logos' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users can update own company logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'company-logos' AND (storage.foldername(name))[2] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'company-logos' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users can delete own company logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'company-logos' AND (storage.foldername(name))[2] = auth.uid()::text);