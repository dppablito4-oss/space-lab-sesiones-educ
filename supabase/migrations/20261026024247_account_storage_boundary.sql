BEGIN;
-- Keep ownership/folder policies intact. Suspensions apply to authenticated
-- logo operations as well as public-schema data; unrelated buckets are unchanged.
CREATE POLICY account_active_logos ON storage.objects
AS RESTRICTIVE FOR ALL TO authenticated
USING (bucket_id <> 'logos' OR (SELECT public.account_is_active()))
WITH CHECK (bucket_id <> 'logos' OR (SELECT public.account_is_active()));
COMMIT;
