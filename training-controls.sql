-- =====================================================
-- SCRIPT SQL PARA MÓDULO DE CONTROLES DE ENTRENAMIENTO
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- 1. Crear tabla de controles de entrenamiento
CREATE TABLE IF NOT EXISTS public.training_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  control_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance INTEGER NOT NULL,
  arrows_count INTEGER NOT NULL CHECK (arrows_count > 0),
  m1_score INTEGER NOT NULL DEFAULT 0 CHECK (m1_score >= 0),
  m2_score INTEGER NOT NULL DEFAULT 0 CHECK (m2_score >= 0),
  total_score INTEGER GENERATED ALWAYS AS (m1_score + m2_score) STORED,
  arrow_average DECIMAL(5,2),
  tens_plus_x INTEGER DEFAULT 0 CHECK (tens_plus_x >= 0),
  x_count INTEGER DEFAULT 0 CHECK (x_count >= 0),
  red_percentage DECIMAL(5,2) CHECK (red_percentage >= 0 AND red_percentage <= 100),
  yellow_percentage DECIMAL(5,2) CHECK (yellow_percentage >= 0 AND yellow_percentage <= 100),
  is_academy_record BOOLEAN DEFAULT FALSE,
  evaluator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_training_controls_student 
ON public.training_controls(student_id);

CREATE INDEX IF NOT EXISTS idx_training_controls_date 
ON public.training_controls(control_date DESC);

CREATE INDEX IF NOT EXISTS idx_training_controls_distance 
ON public.training_controls(distance);

CREATE INDEX IF NOT EXISTS idx_training_controls_record 
ON public.training_controls(is_academy_record) WHERE is_academy_record = TRUE;

-- 3. Función para calcular arrow_average y verificar récord
CREATE OR REPLACE FUNCTION update_training_control_calculations()
RETURNS TRIGGER AS $$
DECLARE
  current_record INTEGER;
BEGIN
  -- Calcular arrow_average
  IF NEW.arrows_count > 0 THEN
    NEW.arrow_average := ROUND((NEW.m1_score + NEW.m2_score)::DECIMAL / NEW.arrows_count, 2);
  ELSE
    NEW.arrow_average := 0;
  END IF;

  -- Verificar si es récord de la academia para esta distancia
  SELECT MAX(m1_score + m2_score) INTO current_record
  FROM public.training_controls
  WHERE distance = NEW.distance
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF current_record IS NULL OR (NEW.m1_score + NEW.m2_score) >= current_record THEN
    NEW.is_academy_record := TRUE;
  ELSE
    NEW.is_academy_record := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para ejecutar cálculos antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS trigger_training_control_calculations ON public.training_controls;
CREATE TRIGGER trigger_training_control_calculations
  BEFORE INSERT OR UPDATE ON public.training_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_training_control_calculations();

-- 5. Función para actualizar récords cuando se elimina un control
CREATE OR REPLACE FUNCTION update_records_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el control eliminado era un récord, recalcular récords para esa distancia
  IF OLD.is_academy_record THEN
    UPDATE public.training_controls
    SET is_academy_record = (
      (m1_score + m2_score) = (
        SELECT MAX(m1_score + m2_score)
        FROM public.training_controls
        WHERE distance = OLD.distance
      )
    )
    WHERE distance = OLD.distance;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para recalcular récords al eliminar
DROP TRIGGER IF EXISTS trigger_update_records_on_delete ON public.training_controls;
CREATE TRIGGER trigger_update_records_on_delete
  AFTER DELETE ON public.training_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_records_on_delete();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- SELECT * FROM public.training_controls LIMIT 10;
