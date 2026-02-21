-- ============================================
-- 123Strik: Yarn Inventory - ændr mængde til antal nøgler (decimal)
-- Kør dette i Supabase SQL Editor
-- ============================================

-- Fjern color_hex kolonne (bruges ikke længere)
ALTER TABLE yarn_inventory DROP COLUMN IF EXISTS color_hex;

-- Omdøb amount_grams til quantity og skift til NUMERIC for decimaltal
ALTER TABLE yarn_inventory RENAME COLUMN amount_grams TO quantity;
ALTER TABLE yarn_inventory ALTER COLUMN quantity TYPE NUMERIC(6,1) USING quantity::NUMERIC(6,1);
ALTER TABLE yarn_inventory ALTER COLUMN quantity SET DEFAULT 0;
