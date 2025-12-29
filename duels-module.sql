-- =============================================
-- MÓDULO DE DUELOS - ESTRUCTURA DE BASE DE DATOS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- TABLA PRINCIPAL: duels
-- =============================================
CREATE TABLE IF NOT EXISTS duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    duel_date DATE NOT NULL,
    distance INTEGER NOT NULL,
    
    -- Oponente
    opponent_type VARCHAR(10) NOT NULL CHECK (opponent_type IN ('internal', 'external')),
    opponent_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    opponent_name VARCHAR(255),
    opponent_club VARCHAR(255),
    opponent_country VARCHAR(100),
    
    -- Tipo de evento (igual que controles)
    event_type VARCHAR(20) NOT NULL DEFAULT 'training' 
        CHECK (event_type IN ('training', 'internal', 'local', 'regional', 'national', 'international')),
    
    -- Datos de torneo (solo si event_type != 'training')
    tournament_name VARCHAR(255),
    tournament_stage VARCHAR(20) CHECK (tournament_stage IN ('64', '32', '16', '8', '4', 'semis', 'bronze', 'gold')),
    tournament_position INTEGER CHECK (tournament_position > 0),
    
    -- Resultados calculados (almacenados para queries rápidas)
    our_total_score INTEGER NOT NULL DEFAULT 0,
    opponent_total_score INTEGER NOT NULL DEFAULT 0,
    our_set_points INTEGER NOT NULL DEFAULT 0 CHECK (our_set_points >= 0 AND our_set_points <= 7),
    opponent_set_points INTEGER NOT NULL DEFAULT 0 CHECK (opponent_set_points >= 0 AND opponent_set_points <= 7),
    result VARCHAR(4) CHECK (result IN ('win', 'loss')),
    is_shoot_off BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Datos de shoot-off (solo si is_shoot_off = true)
    our_shoot_off_score INTEGER,
    opponent_shoot_off_score INTEGER,
    our_shoot_off_is_x BOOLEAN DEFAULT FALSE,
    opponent_shoot_off_is_x BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_opponent CHECK (
        (opponent_type = 'internal' AND opponent_student_id IS NOT NULL) OR
        (opponent_type = 'external' AND opponent_name IS NOT NULL)
    ),
    CONSTRAINT valid_shoot_off CHECK (
        (is_shoot_off = FALSE) OR
        (is_shoot_off = TRUE AND our_shoot_off_score IS NOT NULL AND opponent_shoot_off_score IS NOT NULL)
    )
);

-- =============================================
-- TABLA DE SETS: duel_sets
-- =============================================
CREATE TABLE IF NOT EXISTS duel_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
    our_score INTEGER NOT NULL CHECK (our_score >= 0),
    opponent_score INTEGER NOT NULL CHECK (opponent_score >= 0),
    our_set_points INTEGER NOT NULL CHECK (our_set_points IN (0, 1, 2)),
    opponent_set_points INTEGER NOT NULL CHECK (opponent_set_points IN (0, 1, 2)),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un set por número por duelo
    UNIQUE(duel_id, set_number)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_duels_student_id ON duels(student_id);
CREATE INDEX IF NOT EXISTS idx_duels_date ON duels(duel_date DESC);
CREATE INDEX IF NOT EXISTS idx_duels_event_type ON duels(event_type);
CREATE INDEX IF NOT EXISTS idx_duels_result ON duels(result);
CREATE INDEX IF NOT EXISTS idx_duels_tournament ON duels(student_id, event_type, tournament_position) 
    WHERE event_type != 'training' AND tournament_position IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_duel_sets_duel_id ON duel_sets(duel_id);

-- =============================================
-- TRIGGER: Actualizar updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_duel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_duel_updated_at ON duels;
CREATE TRIGGER trigger_duel_updated_at
    BEFORE UPDATE ON duels
    FOR EACH ROW
    EXECUTE FUNCTION update_duel_updated_at();

-- =============================================
-- FUNCIÓN: Calcular puntos de set
-- =============================================
CREATE OR REPLACE FUNCTION calculate_set_points(our_score INTEGER, opponent_score INTEGER)
RETURNS TABLE(our_points INTEGER, opponent_points INTEGER) AS $$
BEGIN
    IF our_score > opponent_score THEN
        RETURN QUERY SELECT 2, 0;
    ELSIF our_score = opponent_score THEN
        RETURN QUERY SELECT 1, 1;
    ELSE
        RETURN QUERY SELECT 0, 2;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- TRIGGER: Auto-calcular set points al insertar/actualizar set
-- =============================================
CREATE OR REPLACE FUNCTION auto_calculate_set_points()
RETURNS TRIGGER AS $$
DECLARE
    points RECORD;
BEGIN
    SELECT * INTO points FROM calculate_set_points(NEW.our_score, NEW.opponent_score);
    NEW.our_set_points := points.our_points;
    NEW.opponent_set_points := points.opponent_points;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_set_points ON duel_sets;
CREATE TRIGGER trigger_auto_set_points
    BEFORE INSERT OR UPDATE ON duel_sets
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_set_points();

-- =============================================
-- TRIGGER: Actualizar totales del duelo cuando cambian los sets
-- =============================================
CREATE OR REPLACE FUNCTION update_duel_totals()
RETURNS TRIGGER AS $$
DECLARE
    duel_record RECORD;
    total_our_score INTEGER;
    total_opponent_score INTEGER;
    total_our_set_points INTEGER;
    total_opponent_set_points INTEGER;
BEGIN
    -- Determinar qué duel_id usar
    IF TG_OP = 'DELETE' THEN
        -- Calcular totales para el duelo
        SELECT 
            COALESCE(SUM(our_score), 0),
            COALESCE(SUM(opponent_score), 0),
            COALESCE(SUM(our_set_points), 0),
            COALESCE(SUM(opponent_set_points), 0)
        INTO total_our_score, total_opponent_score, total_our_set_points, total_opponent_set_points
        FROM duel_sets
        WHERE duel_id = OLD.duel_id;
        
        -- Actualizar duelo
        UPDATE duels SET
            our_total_score = total_our_score,
            opponent_total_score = total_opponent_score,
            our_set_points = total_our_set_points,
            opponent_set_points = total_opponent_set_points
        WHERE id = OLD.duel_id;
    ELSE
        -- Calcular totales para el duelo
        SELECT 
            COALESCE(SUM(our_score), 0),
            COALESCE(SUM(opponent_score), 0),
            COALESCE(SUM(our_set_points), 0),
            COALESCE(SUM(opponent_set_points), 0)
        INTO total_our_score, total_opponent_score, total_our_set_points, total_opponent_set_points
        FROM duel_sets
        WHERE duel_id = NEW.duel_id;
        
        -- Actualizar duelo
        UPDATE duels SET
            our_total_score = total_our_score,
            opponent_total_score = total_opponent_score,
            our_set_points = total_our_set_points,
            opponent_set_points = total_opponent_set_points
        WHERE id = NEW.duel_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_duel_totals ON duel_sets;
CREATE TRIGGER trigger_update_duel_totals
    AFTER INSERT OR UPDATE OR DELETE ON duel_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_duel_totals();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_sets ENABLE ROW LEVEL SECURITY;

-- Políticas para duels
CREATE POLICY "Duels are viewable by everyone" ON duels
    FOR SELECT USING (true);

CREATE POLICY "Duels are insertable by authenticated users" ON duels
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Duels are updatable by authenticated users" ON duels
    FOR UPDATE USING (true);

CREATE POLICY "Duels are deletable by authenticated users" ON duels
    FOR DELETE USING (true);

-- Políticas para duel_sets
CREATE POLICY "Duel sets are viewable by everyone" ON duel_sets
    FOR SELECT USING (true);

CREATE POLICY "Duel sets are insertable by authenticated users" ON duel_sets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Duel sets are updatable by authenticated users" ON duel_sets
    FOR UPDATE USING (true);

CREATE POLICY "Duel sets are deletable by authenticated users" ON duel_sets
    FOR DELETE USING (true);

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE duels IS 'Registro de duelos de arqueros';
COMMENT ON TABLE duel_sets IS 'Sets individuales de cada duelo';
COMMENT ON COLUMN duels.opponent_type IS 'internal = alumno de la academia, external = oponente externo';
COMMENT ON COLUMN duels.tournament_stage IS '64=64vos, 32=32vos, 16=16avos, 8=8vos, 4=4tos, semis, bronze, gold';
COMMENT ON COLUMN duels.our_shoot_off_is_x IS 'True si el arquero tiró X (10+) en el shoot-off';
