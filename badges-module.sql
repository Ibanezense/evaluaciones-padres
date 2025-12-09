-- =====================================================
-- MÓDULO DE BADGES - SCRIPT SQL PARA SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. Crear tabla student_badges (relación alumno-badge)
CREATE TABLE IF NOT EXISTS public.student_badges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at timestamptz NOT NULL DEFAULT now(),
    awarded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    source text NOT NULL DEFAULT 'manual',
    context jsonb DEFAULT NULL,
    created_at timestamptz DEFAULT now(),
    
    -- Constraint: un alumno no puede tener el mismo badge dos veces
    CONSTRAINT student_badges_student_badge_unique UNIQUE (student_id, badge_id)
);

-- 2. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id 
ON public.student_badges(student_id);

CREATE INDEX IF NOT EXISTS idx_student_badges_badge_id 
ON public.student_badges(badge_id);

CREATE INDEX IF NOT EXISTS idx_student_badges_awarded_at 
ON public.student_badges(awarded_at DESC);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acceso (permisivo para este proyecto)
CREATE POLICY "Permitir lectura de student_badges" ON public.student_badges
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de student_badges" ON public.student_badges
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de student_badges" ON public.student_badges
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de student_badges" ON public.student_badges
    FOR DELETE USING (true);

-- =====================================================
-- VERIFICACIÓN (ejecutar después del script anterior)
-- =====================================================

-- Ver estructura de la tabla creada
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'student_badges';

-- Ver constraints
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'student_badges';
