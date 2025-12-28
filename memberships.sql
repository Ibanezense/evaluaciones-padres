-- =============================================
-- MÓDULO DE MEMBRESÍAS
-- Agregar campos de membresía a la tabla students
-- =============================================

-- Agregar columna de estado de membresía
ALTER TABLE students ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active' 
    CHECK (membership_status IN ('active', 'inactive', 'debt'));

-- Agregar fecha de inicio de membresía
ALTER TABLE students ADD COLUMN IF NOT EXISTS membership_start_date DATE;

-- Agregar cantidad total de clases contratadas
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_classes INTEGER DEFAULT 0;

-- Agregar clases restantes
ALTER TABLE students ADD COLUMN IF NOT EXISTS remaining_classes INTEGER DEFAULT 0;

-- Comentarios
COMMENT ON COLUMN students.membership_status IS 'Estado de la membresía: active, inactive, debt';
COMMENT ON COLUMN students.membership_start_date IS 'Fecha de inicio de la membresía actual';
COMMENT ON COLUMN students.total_classes IS 'Cantidad total de clases contratadas en el plan';
COMMENT ON COLUMN students.remaining_classes IS 'Clases restantes del plan actual';
