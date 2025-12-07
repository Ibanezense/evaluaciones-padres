-- =============================================
-- AGREGAR SOPORTE DE TORNEOS A CONTROLES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar columnas para tipo de evento y datos de torneo
ALTER TABLE training_controls
ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) DEFAULT 'training',
ADD COLUMN IF NOT EXISTS tournament_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Crear índice para búsquedas por tipo de evento
CREATE INDEX IF NOT EXISTS idx_training_controls_event_type 
ON training_controls(event_type);

-- Crear índice para búsquedas de torneos
CREATE INDEX IF NOT EXISTS idx_training_controls_tournament 
ON training_controls(student_id, event_type, position)
WHERE event_type != 'training' AND position IS NOT NULL;

-- Comentarios para documentar los campos
COMMENT ON COLUMN training_controls.event_type IS 'Tipo de evento: training, internal, local, regional, national, international';
COMMENT ON COLUMN training_controls.tournament_name IS 'Nombre del torneo (solo si event_type != training)';
COMMENT ON COLUMN training_controls.position IS 'Posición obtenida en torneo (solo para torneos)';

-- Actualizar registros existentes (por defecto son entrenamientos)
UPDATE training_controls 
SET event_type = 'training' 
WHERE event_type IS NULL;
