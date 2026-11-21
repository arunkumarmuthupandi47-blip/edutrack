-- Supabase RAG Knowledge Documents Table & Hybrid Search Function
BEGIN;

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id SERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default-workspace',
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Course Syllabus',
  course_code TEXT NOT NULL DEFAULT 'GENERAL',
  source TEXT NOT NULL DEFAULT 'University Knowledge Base',
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL,
  embedding extensions.vector(768),
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(course_code, '') || ' ' ||
      coalesce(content, '')
    )
  ) STORED,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_workspace_id ON public.knowledge_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON public.knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_search_tsv ON public.knowledge_documents USING GIN(search_tsv);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.knowledge_documents TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.knowledge_documents_id_seq TO anon, authenticated;

CREATE POLICY "knowledge_documents_select_workspace" ON public.knowledge_documents
  FOR SELECT TO anon, authenticated
  USING (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text);

CREATE POLICY "knowledge_documents_insert_workspace" ON public.knowledge_documents
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text)
    AND length(trim(title)) > 0
    AND length(trim(content)) > 0
  );

CREATE POLICY "knowledge_documents_update_workspace" ON public.knowledge_documents
  FOR UPDATE TO anon, authenticated
  USING (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text)
  WITH CHECK (
    (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text)
    AND length(trim(title)) > 0
  );

CREATE POLICY "knowledge_documents_delete_workspace" ON public.knowledge_documents
  FOR DELETE TO anon, authenticated
  USING (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text);

CREATE OR REPLACE FUNCTION public.search_knowledge_documents(
  query_text TEXT,
  match_limit INTEGER DEFAULT 4
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  category TEXT,
  course_code TEXT,
  source TEXT,
  tags TEXT[],
  content TEXT,
  similarity REAL
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH cleaned AS (
    SELECT
      trim(coalesce(query_text, '')) AS q,
      CASE
        WHEN trim(coalesce(query_text, '')) = '' THEN NULL::tsquery
        ELSE regexp_replace(
          plainto_tsquery('english', trim(coalesce(query_text, '')))::text,
          ' & ',
          ' | ',
          'g'
        )::tsquery
      END AS or_tsq,
      plainto_tsquery('english', trim(coalesce(query_text, ''))) AS and_tsq
  ),
  scored AS (
    SELECT
      d.id,
      d.title,
      d.category,
      d.course_code,
      d.source,
      d.tags,
      d.content,
      (
        CASE
          WHEN c.q = '' OR c.or_tsq IS NULL OR c.or_tsq::text = '' THEN 0.5
          ELSE
            COALESCE(ts_rank_cd(d.search_tsv, c.or_tsq), 0) * 1.5 +
            COALESCE(ts_rank_cd(d.search_tsv, c.and_tsq), 0) * 2.5 +
            CASE WHEN d.title ILIKE '%' || c.q || '%' THEN 0.6 ELSE 0.0 END +
            CASE WHEN d.course_code ILIKE '%' || c.q || '%' THEN 0.5 ELSE 0.0 END
        END
      )::REAL AS raw_score
    FROM public.knowledge_documents d
    CROSS JOIN cleaned c
    WHERE
      d.workspace_id = 'default-workspace'
      AND (
        c.q = ''
        OR c.or_tsq IS NULL
        OR c.or_tsq::text = ''
        OR d.search_tsv @@ c.or_tsq
        OR d.title ILIKE '%' || c.q || '%'
        OR d.content ILIKE '%' || c.q || '%'
        OR d.course_code ILIKE '%' || c.q || '%'
      )
  )
  SELECT
    s.id,
    s.title,
    s.category,
    s.course_code,
    s.source,
    s.tags,
    s.content,
    LEAST(0.99, GREATEST(0.15, (0.35 + s.raw_score * 3.0)))::REAL AS similarity
  FROM scored s
  ORDER BY s.raw_score DESC, s.id ASC
  LIMIT match_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_knowledge_documents(TEXT, INTEGER) TO anon, authenticated;

COMMIT;
