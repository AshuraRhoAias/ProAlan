-- ============================================================
-- MastrFlow — Database Schema  (idempotente, MySQL 8.0)
-- Re-ejecutable sin errores: IF NOT EXISTS + INSERT IGNORE
-- ============================================================

CREATE DATABASE IF NOT EXISTS mastrflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mastrflow;

-- ── Restaurante ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurant (
  id              INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120) NOT NULL DEFAULT 'My Restaurant',
  currency_symbol VARCHAR(5)   NOT NULL DEFAULT '$',
  tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  num_tables      SMALLINT     UNSIGNED NOT NULL DEFAULT 6,
  use_system_time TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO restaurant (id, name, currency_symbol, tax_rate)
VALUES (1, 'My Restaurant', '$', 0.00);

-- ── Tipos de cliente ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_types (
  id         INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(40) NOT NULL,
  color      VARCHAR(10) NOT NULL DEFAULT '#6b7280',
  sort_order SMALLINT    UNSIGNED NOT NULL DEFAULT 0,
  active     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO customer_types (id, name, color, sort_order) VALUES
  (1, 'DIRECT', '#6b7280', 1),
  (2, 'DIDI',   '#f59e0b', 2),
  (3, 'UBER',   '#10b981', 3),
  (4, 'RAPPI',  '#ef4444', 4),
  (5, 'MOB+',   '#8b5cf6', 5);

-- ── Usuarios ─────────────────────────────────────────────────
-- pin: VARCHAR(20) — acepta 4 a 20 dígitos numéricos
CREATE TABLE IF NOT EXISTS users (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  role       ENUM('admin','manager','kitchen','waiter') NOT NULL DEFAULT 'waiter',
  pin        VARCHAR(20)  NOT NULL,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_pin (pin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (id, name, role, pin) VALUES
  (1, 'Admin',   'admin',   '0000'),
  (2, 'Manager', 'manager', '1234'),
  (3, 'Chef',    'kitchen', '5678'),
  (4, 'Mesero',  'waiter',  '9999');

-- ── Mesas ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables_restaurant (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  capacity   SMALLINT     UNSIGNED NOT NULL DEFAULT 4,
  status     ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tables_restaurant (id, name, capacity) VALUES
  (1, 'Mesa 1', 4), (2, 'Mesa 2', 4), (3, 'Mesa 3', 4),
  (4, 'Mesa 4', 4), (5, 'Mesa 5', 4), (6, 'Mesa 6', 4),
  (7, 'Mesa 7', 4), (8, 'Mesa 8', 6), (9, 'Barra',  8);

-- ── Turnos (shifts) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  start_hour TINYINT      UNSIGNED NOT NULL DEFAULT 0,
  end_hour   TINYINT      UNSIGNED NOT NULL DEFAULT 23,
  date       DATE         NOT NULL,
  opened_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at  DATETIME,
  status     ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_by INT          UNSIGNED,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Categorías de menú ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  sort_order SMALLINT     UNSIGNED NOT NULL DEFAULT 0,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO menu_categories (id, name, sort_order) VALUES
  (1, 'Burgers',  1),
  (2, 'Sides',    2),
  (3, 'Mains',    3),
  (4, 'Drinks',   4);

-- ── Items de menú ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT           UNSIGNED NOT NULL,
  name        VARCHAR(120)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  available   TINYINT(1)    NOT NULL DEFAULT 1,
  photo_url   VARCHAR(255),
  allergens   VARCHAR(255)  NOT NULL DEFAULT '',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO menu_items (id, category_id, name, description, price, allergens, photo_url) VALUES
  -- Burgers
  (1,  1, 'Classic Burger',      'Res 180g, lechuga, jitomate, pepinillos', 120.00, 'gluten,lácteos',  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
  (2,  1, 'Smash Burger',        'Doble smash, queso americano, salsa especial', 145.00, 'gluten,lácteos', 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=400'),
  (3,  1, 'BBQ Bacon Burger',    'Res 180g, bacon, cebolla asada, BBQ',    155.00, 'gluten,lácteos',  'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400'),
  (4,  1, 'Veggie Burger',       'Medallón de frijol negro, aguacate',      130.00, 'gluten',          'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400'),
  -- Sides
  (5,  2, 'Papas a la Francesa', 'Papas crujientes con sal de mar',         55.00,  '',                'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400'),
  (6,  2, 'Aros de Cebolla',     'Aros crujientes con aderezo ranch',       65.00,  'gluten,lácteos',  'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400'),
  (7,  2, 'Nuggets x8',          '8 piezas con salsa BBQ o ranch',          75.00,  'gluten',          'https://images.unsplash.com/photo-1562967914-608f82629710?w=400'),
  -- Mains
  (8,  3, 'Hot Dog Clásico',     'Salchicha ahumada, mostaza, ketchup',     80.00,  'gluten',          'https://images.unsplash.com/photo-1619740455993-9d622e5f6b68?w=400'),
  (9,  3, 'Pizza Margarita',     'Salsa de tomate, mozzarella, albahaca',   160.00, 'gluten,lácteos',  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
  (10, 3, 'Tacos x3',            'Pastor, cebolla, cilantro, salsa verde',   90.00, '',                'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400'),
  -- Drinks
  (11, 4, 'Refresco',            'Coca-Cola, Sprite o Fanta 355ml',          35.00, '',                'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400'),
  (12, 4, 'Agua Mineral',        'Con o sin gas 500ml',                      28.00, '',                'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400'),
  (13, 4, 'Malteada',            'Chocolate, vainilla o fresa',              85.00, 'lácteos',         'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400'),
  (14, 4, 'Jugo Natural',        'Naranja, mango o zanahoria',               50.00, '',                'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400');

-- ── Alérgenos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_item_allergens (
  id           INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT         UNSIGNED NOT NULL,
  name         VARCHAR(80) NOT NULL,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Modificadores por categoría ──────────────────────────────
CREATE TABLE IF NOT EXISTS category_modifiers (
  id          INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT         UNSIGNED NOT NULL,
  name        VARCHAR(80) NOT NULL,
  sort_order  SMALLINT    UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO category_modifiers (id, category_id, name, sort_order) VALUES
  (1,  1, 'LECHUGA',              1),
  (2,  1, 'JITOMATE',             2),
  (3,  1, 'MAYONESA',             3),
  (4,  1, 'PEPINILLOS',           4),
  (5,  1, 'CEBOLLA ASADA',        5),
  (6,  1, 'MOSTAZA',              6),
  (7,  1, 'KETCHUP',              7),
  (8,  1, 'SALSA ESPECIAL',       8),
  (9,  1, 'QUESO EXTRA',          9),
  (10, 1, 'BACON EXTRA',         10),
  (11, 3, 'SIN SAL',              1),
  (12, 3, 'EXTRA PICANTE',        2),
  (13, 4, 'SIN HIELO',            1),
  (14, 4, 'CON HIELO EXTRA',      2);

-- ── Órdenes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code             CHAR(6)      NOT NULL,
  table_id         INT          UNSIGNED NOT NULL,
  customer_type_id INT          UNSIGNED NOT NULL,
  shift_id         INT          UNSIGNED,
  status           ENUM('waiting','cooking','ready','closed','cancelled') NOT NULL DEFAULT 'waiting',
  payment_method   VARCHAR(20),
  notes            TEXT,
  total            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tip              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cancelled_value  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at       DATETIME,
  ready_at         DATETIME,
  closed_at        DATETIME,
  FOREIGN KEY (table_id)         REFERENCES tables_restaurant(id),
  FOREIGN KEY (customer_type_id) REFERENCES customer_types(id),
  FOREIGN KEY (shift_id)         REFERENCES shifts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Añadir columna tip si la tabla existía sin ella (workaround MySQL 8.0)
SET @tip_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'tip'
);
SET @sql_tip = IF(@tip_exists = 0,
  'ALTER TABLE orders ADD COLUMN tip DECIMAL(10,2) NOT NULL DEFAULT 0.00',
  'SELECT 1'
);
PREPARE stmt_tip FROM @sql_tip;
EXECUTE stmt_tip;
DEALLOCATE PREPARE stmt_tip;

-- ── Items de orden ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT          UNSIGNED NOT NULL,
  menu_item_id INT          UNSIGNED NOT NULL,
  quantity     SMALLINT     UNSIGNED NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  notes        TEXT,
  status       ENUM('pending','cancelled') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (order_id)     REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Modificadores por item ────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id            INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT         UNSIGNED NOT NULL,
  name          VARCHAR(80) NOT NULL,
  type          ENUM('included','removed','extra') NOT NULL DEFAULT 'included',
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Lista de compras ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_items (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  checked    TINYINT(1)   NOT NULL DEFAULT 0,
  session_id VARCHAR(40)  NOT NULL,
  added_by   INT          UNSIGNED,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Índices (DROP + CREATE para idempotencia en MySQL 8.0) ───
DROP INDEX IF EXISTS idx_orders_status  ON orders;
DROP INDEX IF EXISTS idx_orders_table   ON orders;
DROP INDEX IF EXISTS idx_orders_shift   ON orders;
DROP INDEX IF EXISTS idx_orders_created ON orders;
DROP INDEX IF EXISTS idx_items_order    ON order_items;
DROP INDEX IF EXISTS idx_users_pin      ON users;

CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_orders_table   ON orders(table_id);
CREATE INDEX idx_orders_shift   ON orders(shift_id);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_items_order    ON order_items(order_id);
