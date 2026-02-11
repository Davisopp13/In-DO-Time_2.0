-- ============================================
-- Replace Purple with Green
-- ============================================

-- Update DO Code Lab workspace color to Green #84cc16 (Fern)
UPDATE workspaces 
SET color = '#84cc16' 
WHERE slug = 'do-code-lab';

-- Update Personal workspace color to Emerald #10b981 (to avoid conflict with #84cc16)
UPDATE workspaces 
SET color = '#10b981' 
WHERE slug = 'personal';

-- Update any manual projects that used old purple colors to Green
UPDATE projects 
SET color = '#84cc16' 
WHERE color IN ('#c084fc', '#8b5cf6', '#a855f7', '#7c3aed', '#d8b4fe');

-- Update any clients that used old purple colors to Green
UPDATE clients 
SET color = '#84cc16' 
WHERE color IN ('#c084fc', '#8b5cf6', '#a855f7', '#7c3aed', '#d8b4fe');
