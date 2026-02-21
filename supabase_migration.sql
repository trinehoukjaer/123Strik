-- ============================================
-- 123Strik: Strikkelager Migration
-- Kør dette i Supabase SQL Editor
-- ============================================

-- 1. Yarn Inventory
CREATE TABLE yarn_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  brand TEXT,
  color TEXT,
  color_hex TEXT DEFAULT '#808080',
  amount_grams INTEGER DEFAULT 0,
  image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE yarn_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yarn" ON yarn_inventory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own yarn" ON yarn_inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own yarn" ON yarn_inventory
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own yarn" ON yarn_inventory
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Needles
CREATE TABLE needles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  size_mm NUMERIC(3,1) NOT NULL,
  length_cm INTEGER,
  material TEXT,
  type TEXT NOT NULL CHECK (type IN ('rundpind', 'ret', 'strømpepind')),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE needles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own needles" ON needles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own needles" ON needles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own needles" ON needles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own needles" ON needles
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Swatches
CREATE TABLE swatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yarn_info TEXT,
  needle_size TEXT,
  gauge_rows NUMERIC(4,1),
  gauge_stitches NUMERIC(4,1),
  image_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE swatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swatches" ON swatches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own swatches" ON swatches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own swatches" ON swatches
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own swatches" ON swatches
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Recipe Library
CREATE TABLE recipe_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recipe_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes" ON recipe_library
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON recipe_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipe_library
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipe_library
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_yarn
  BEFORE UPDATE ON yarn_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_needles
  BEFORE UPDATE ON needles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_swatches
  BEFORE UPDATE ON swatches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-photos', 'inventory-photos', false);

-- Storage policies: users can only access their own user_id/ folder
CREATE POLICY "Users can upload inventory photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inventory-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own inventory photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inventory-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own inventory photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'inventory-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
