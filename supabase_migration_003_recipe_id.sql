-- ============================================
-- 123Strik: Tilføj recipe_id til knitting_projects
-- Kør dette i Supabase SQL Editor
-- ============================================

ALTER TABLE knitting_projects
  ADD COLUMN recipe_id UUID REFERENCES recipe_library(id) ON DELETE SET NULL;
