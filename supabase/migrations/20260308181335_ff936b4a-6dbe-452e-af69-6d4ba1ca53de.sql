
-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  summary text,
  file_url text,
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for note files
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', false);

CREATE POLICY "Users can upload own note files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own note files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own note files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'notes' AND (storage.foldername(name))[1] = auth.uid()::text);
