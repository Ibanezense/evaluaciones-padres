-- Cambiar el campo own_equipment de boolean a enum de tipo de arco
-- Primero agregar el nuevo campo
ALTER TABLE students ADD COLUMN IF NOT EXISTS bow_type TEXT DEFAULT 'none' CHECK (bow_type IN ('none', 'own', 'assigned'));

-- Migrar datos existentes
UPDATE students SET bow_type = 'own' WHERE own_equipment = true;

-- Opcional: eliminar el campo antiguo (solo si ya no se usa)
-- ALTER TABLE students DROP COLUMN IF EXISTS own_equipment;

COMMENT ON COLUMN students.bow_type IS 'Tipo de arco: none=sin arco, own=arco propio, assigned=arco asignado';
