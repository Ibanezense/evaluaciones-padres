-- =====================================================
-- SCRIPT SQL PARA SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. Agregar campo access_code a la tabla students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS access_code text UNIQUE;

-- 2. Agregar campos faltantes a technical_evaluations
ALTER TABLE public.technical_evaluations 
ADD COLUMN IF NOT EXISTS grip integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS expansion integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS safety integer DEFAULT 0;

-- 3. Generar códigos de acceso únicos para alumnos existentes
-- Esto genera códigos de 6 caracteres alfanuméricos
UPDATE public.students 
SET access_code = UPPER(SUBSTRING(MD5(RANDOM()::text || id::text) FROM 1 FOR 6))
WHERE access_code IS NULL;

-- 4. Crear índice para búsqueda por código de acceso
CREATE INDEX IF NOT EXISTS idx_students_access_code 
ON public.students(access_code);

-- =====================================================
-- VERIFICACIÓN (ejecutar después del script anterior)
-- =====================================================

-- Ver estructura actualizada de students
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'students' AND column_name = 'access_code';

-- Ver códigos generados
-- SELECT first_name, last_name, access_code FROM public.students WHERE is_active = true;
