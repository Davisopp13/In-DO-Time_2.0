-- ============================================
-- In DO Time 2.0 — Workspace Architecture
-- ============================================

-- Create Workspaces table
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON workspaces
  FOR ALL USING (auth.role() = 'authenticated');

-- Add trigger for workspaces
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial workspaces
INSERT INTO workspaces (name, slug, color, icon) VALUES
('Hapag-Lloyd', 'hapag-lloyd', '#38bdf8', 'Ship'),
('DO Code Lab', 'do-code-lab', '#84cc16', 'Code'),
('Personal', 'personal', '#10b981', 'User'),
('DObot Development', 'dobot-development', '#fb923c', 'Bot');

-- Update Projects table to link to Workspaces
ALTER TABLE projects ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Migrate existing categories to workspaces
UPDATE projects SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'hapag-lloyd') WHERE category = 'hapag';
UPDATE projects SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'do-code-lab') WHERE category = 'do_code_lab';
UPDATE projects SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'personal') WHERE category = 'personal';
UPDATE projects SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'dobot-development') WHERE category = 'dobot';

-- For any projects that didn't match, assign to Personal
UPDATE projects SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'personal') WHERE workspace_id IS NULL;

-- Make workspace_id NOT NULL and remove category
ALTER TABLE projects ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE projects DROP COLUMN category;

-- Create index on workspace_id
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
