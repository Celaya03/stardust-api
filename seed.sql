CREATE TABLE IF NOT EXISTS catalogo_productos (
    id_catalogo SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    description TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    duracion_minutos INT NOT NULL
);

INSERT INTO catalogo_productos (store_id, nombre, description, precio, stock, duracion_minutos) VALUES
(1, 'Café Americano', 'Café recién preparado, suave y aromático', 35.00, 100, 5),
(1, 'Café Latte', 'Espresso con leche vaporizada', 45.00, 100, 7),
(1, 'Cappuccino', 'Espresso con espuma de leche', 45.00, 100, 7),
(1, 'Café Mocha', 'Espresso con chocolate y leche', 50.00, 80, 8),
(1, 'Té Verde', 'Té verde orgánico', 30.00, 150, 5),
(1, 'Té Negro', 'Té negro inglés', 30.00, 150, 5),
(1, 'Chocolate Caliente', 'Chocolate belga con leche', 40.00, 90, 7);

-- BEBIDAS FRÍAS
INSERT INTO catalogo_productos (store_id, nombre, description, precio, stock, duracion_minutos) VALUES
(1, 'Frappé de Café', 'Café helado batido con hielo', 55.00, 80, 10),
(1, 'Frappé de Chocolate', 'Chocolate helado batido', 55.00, 80, 10),
(1, 'Limonada Natural', 'Limones frescos con menta', 35.00, 100, 5),
(1, 'Smoothie de Fresa', 'Fresas naturales con yogurt', 50.00, 60, 8),
(1, 'Jugo de Naranja', 'Naranja recién exprimida', 40.00, 80, 5);

-- POSTRES
INSERT INTO catalogo_productos (store_id, nombre, description, precio, stock, duracion_minutos) VALUES
(1, 'Cheesecake', 'Pastel de queso estilo NY', 60.00, 30, 0),
(1, 'Brownie', 'Brownie de chocolate con nuez', 45.00, 50, 0),
(1, 'Galleta Chocochip', 'Galleta con chispas de chocolate', 25.00, 100, 0),
(1, 'Muffin de Arándano', 'Muffin con arándanos frescos', 35.00, 60, 0),
(1, 'Croissant', 'Croissant de mantequilla', 30.00, 80, 0);

-- SNACKS
INSERT INTO catalogo_productos (store_id, nombre, description, precio, stock, duracion_minutos) VALUES
(1, 'Sandwich Club', 'Pavo, jamón, queso y vegetales', 75.00, 40, 10),
(1, 'Ensalada César', 'Lechuga romana con aderezo césar', 65.00, 30, 8),
(1, 'Bagel con Queso', 'Bagel tostado con queso crema', 45.00, 50, 5),
(1, 'Wrap de Pollo', 'Tortilla con pollo y vegetales', 70.00, 35, 10);

-- Cliente de ejemplo
INSERT INTO cliente (nombre, correo, telefono) VALUES
('Cliente de Prueba', 'prueba@stardust.com', '6441234567');

-- Verificar productos insertados
SELECT COUNT(*) as total_productos FROM catalogo_productos;
SELECT * FROM catalogo_productos ORDER BY id_catalogo;
