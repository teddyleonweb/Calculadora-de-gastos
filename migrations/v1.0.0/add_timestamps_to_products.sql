-- Añadir campos de fecha a la tabla products en el esquema desarrollo
ALTER TABLE desarrollo.products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Añadir campos de fecha a la tabla products en el esquema public
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Actualizar los registros existentes que no tengan fecha
UPDATE desarrollo.products SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE public.products SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- Crear una función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear un trigger para la tabla products en el esquema desarrollo
DROP TRIGGER IF EXISTS set_updated_at ON desarrollo.products;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON desarrollo.products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Crear un trigger para la tabla products en el esquema public
DROP TRIGGER IF EXISTS set_updated_at ON public.products;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
