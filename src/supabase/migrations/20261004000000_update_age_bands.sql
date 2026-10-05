-- Migración: actualizar franjas de edad de 5/6-8/9 a 5-6/7-8/9-10
-- Fecha: 2026-10-04
-- Autor: Antonio Rivera

-- Paso 1: Actualizar los valores existentes en la tabla
UPDATE public.child_profiles 
SET age_band = CASE 
  WHEN age_band = '5' THEN '5-6'
  WHEN age_band = '6-8' THEN '7-8'
  WHEN age_band = '9' THEN '9-10'
  ELSE age_band
END;

-- Paso 2: Eliminar la restricción antigua
ALTER TABLE public.child_profiles 
DROP CONSTRAINT IF EXISTS child_profiles_age_band_check;

-- Paso 3: Añadir la restricción nueva
ALTER TABLE public.child_profiles 
ADD CONSTRAINT child_profiles_age_band_check 
CHECK (age_band IN ('5-6', '7-8', '9-10'));