-- Add customer_responses table for Customer & Student Response Hub
BEGIN;

CREATE TABLE IF NOT EXISTS public.customer_responses (
  id SERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default-workspace',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General Inquiry',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  response_text TEXT NOT NULL DEFAULT '',
  responded_by TEXT NOT NULL DEFAULT '',
  responded_at TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_responses_workspace_id ON public.customer_responses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customer_responses_status ON public.customer_responses(status);

ALTER TABLE public.customer_responses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_responses TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.customer_responses_id_seq TO anon, authenticated;

CREATE POLICY "customer_responses_select_workspace" ON public.customer_responses
  FOR SELECT TO anon, authenticated
  USING (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text);

CREATE POLICY "customer_responses_insert_workspace" ON public.customer_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text)
    AND length(trim(customer_name)) > 0
    AND length(trim(subject)) > 0
  );

CREATE POLICY "customer_responses_update_workspace" ON public.customer_responses
  FOR UPDATE TO anon, authenticated
  USING (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text)
  WITH CHECK (
    (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text)
    AND length(trim(customer_name)) > 0
  );

CREATE POLICY "customer_responses_delete_workspace" ON public.customer_responses
  FOR DELETE TO anon, authenticated
  USING (workspace_id = 'default-workspace' OR workspace_id = (select auth.uid())::text);

COMMIT;
