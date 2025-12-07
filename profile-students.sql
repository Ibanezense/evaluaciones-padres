-- =============================================
-- MÓDULO DE PADRES/TUTORES - COMPLETO
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna access_code a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS access_code CHAR(6) UNIQUE;

-- Crear índice para búsquedas rápidas por código
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_access_code 
ON profiles(access_code) 
WHERE access_code IS NOT NULL;

-- 2. Crear tabla de relación profile_students
CREATE TABLE IF NOT EXISTS profile_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(20) DEFAULT 'TUTOR',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, student_id)
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_profile_students_profile 
ON profile_students(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_students_student 
ON profile_students(student_id);

-- 3. Función para generar código de acceso único
CREATE OR REPLACE FUNCTION generate_unique_access_code()
RETURNS CHAR(6) AS $$
DECLARE
    new_code CHAR(6);
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Generar código alfanumérico de 6 caracteres (solo letras y números fáciles)
        new_code := upper(
            chr(65 + floor(random() * 26)::int) ||
            chr(65 + floor(random() * 26)::int) ||
            floor(random() * 10)::int::text ||
            floor(random() * 10)::int::text ||
            chr(65 + floor(random() * 26)::int) ||
            floor(random() * 10)::int::text
        );
        
        -- Verificar que no exista en profiles ni en students
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE access_code = new_code
            UNION ALL
            SELECT 1 FROM students WHERE access_code = new_code
        ) INTO exists_already;
        
        IF NOT exists_already THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para generar código automáticamente al crear o actualizar profile
CREATE OR REPLACE FUNCTION auto_generate_profile_access_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo generar si no tiene código
    IF NEW.access_code IS NULL THEN
        NEW.access_code := generate_unique_access_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_access_code ON profiles;
CREATE TRIGGER trigger_profile_access_code
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_profile_access_code();

-- 5. GENERAR CÓDIGOS PARA TUTORES EXISTENTES QUE NO TIENEN
UPDATE profiles 
SET access_code = generate_unique_access_code()
WHERE access_code IS NULL;

-- 6. RLS Policies para profile_students
ALTER TABLE profile_students ENABLE ROW LEVEL SECURITY;

-- Admin puede hacer todo
DROP POLICY IF EXISTS "Admin full access profile_students" ON profile_students;
CREATE POLICY "Admin full access profile_students" ON profile_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Perfiles pueden ver sus propias relaciones
DROP POLICY IF EXISTS "Profiles can view own relations" ON profile_students;
CREATE POLICY "Profiles can view own relations" ON profile_students
    FOR SELECT USING (profile_id = auth.uid());

-- Permitir acceso anónimo para lectura (login con código)
DROP POLICY IF EXISTS "Anon can read profile_students" ON profile_students;
CREATE POLICY "Anon can read profile_students" ON profile_students
    FOR SELECT USING (true);

-- =============================================
-- VINCULAR ESTUDIANTES CON TUTORES
-- Usa el user_id existente en students
-- =============================================

-- Migrar vinculaciones desde students.user_id a profile_students
INSERT INTO profile_students (profile_id, student_id, relationship)
SELECT 
    s.user_id as profile_id,
    s.id as student_id,
    'TUTOR' as relationship
FROM students s
WHERE s.user_id IS NOT NULL
AND s.is_active = true
ON CONFLICT (profile_id, student_id) DO NOTHING;

-- Resultado final
SELECT 
    'Códigos generados: ' || (SELECT count(*) FROM profiles WHERE access_code IS NOT NULL) || ' tutores. ' ||
    'Vinculaciones creadas: ' || (SELECT count(*) FROM profile_students) || ' estudiantes vinculados.' 
    as resultado;
