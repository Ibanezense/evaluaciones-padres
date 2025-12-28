-- =============================================
-- MÓDULO DE ASISTENCIA
-- Tabla para registrar asistencia a clases
-- =============================================

-- Crear tabla de asistencias
CREATE TABLE IF NOT EXISTS class_attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    class_time TIME,
    status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'attended', 'missed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_attendances_student ON class_attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON class_attendances(class_date);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON class_attendances(status);

-- Comentarios
COMMENT ON TABLE class_attendances IS 'Registro de asistencia a clases por alumno';
COMMENT ON COLUMN class_attendances.status IS 'Estados: reserved, attended, missed, cancelled';
