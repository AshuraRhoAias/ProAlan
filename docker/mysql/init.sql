-- ============================================================
-- MastrFlow — Database Schema  (idempotente: seguro re-ejecutar)
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

INSERT IGNORE INTO restaurant (id, name) VALUES (1, 'My Restaurant');

-- ── Customer Types ───────────────────────────────────────────
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
CREATE TABLE IF NOT EXISTS users (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  role       ENUM('admin','manager','kitchen','waiter') NOT NULL DEFAULT 'waiter',
  pin        CHAR(4)      NOT NULL,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (id, name, role, pin) VALUES
  (1, 'Admin',   'admin',   '0000'),
  (2, 'Manager', 'manager', '1234');

-- ── Mesas ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables_restaurant (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  capacity   SMALLINT     UNSIGNED NOT NULL DEFAULT 4,
  status     ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tables_restaurant (id, name, capacity) VALUES
  (1, 'Table 1', 4), (2, 'Table 2', 4), (3, 'Table 3', 4),
  (4, 'Table 4', 4), (5, 'Table 5', 4), (6, 'Table 6', 4);

-- ── Categorías de menú ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  sort_order SMALLINT     UNSIGNED NOT NULL DEFAULT 0,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO menu_categories (id, name, sort_order) VALUES
  (1, 'Burgers', 1), (2, 'Sides', 2), (3, 'Mains', 3), (4, 'Drinks', 4);

-- ── Items de menú ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          INT            UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT            UNSIGNED NOT NULL,
  name        VARCHAR(120)   NOT NULL,
  description TEXT,
  price       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  available   TINYINT(1)     NOT NULL DEFAULT 1,
  photo_url   VARCHAR(255),
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO menu_items (id, category_id, name, description, price, photo_url) VALUES
  (1,  1, 'Classic Burger',    'Carne angus, lechuga, jitomate, cebolla, pepinillos artesanales',  89.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'),
  (2,  1, 'BBQ Bacon Burger',  'Doble carne, bacon ahumado, queso cheddar, salsa BBQ',            119.00, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80'),
  (3,  1, 'Mushroom Swiss',    'Carne angus, champiñones salteados, queso suizo, mayo de ajo',    109.00, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80'),
  (4,  1, 'Spicy Crispy',      'Pollo crujiente picante, col morada, jalapeños, salsa sriracha',   99.00, 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&q=80'),
  (5,  2, 'French Fries',      'Papas fritas crujientes con sal de mar',                           39.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80'),
  (6,  2, 'Onion Rings',       'Aros de cebolla empanizados y fritos, salsa ranch',                49.00, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80'),
  (7,  2, 'Loaded Fries',      'Papas con queso derretido, bacon, cebolla de cambray y crema',     59.00, 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400&q=80'),
  (8,  3, 'Hot Dog Smash',     'Salchicha artesanal, mostaza Dijon, cebolla caramelizada',         79.00, 'https://images.unsplash.com/photo-1612392062631-94d4d52a1f16?w=400&q=80'),
  (9,  3, 'Mac & Cheese Dog',  'Salchicha, macarrones con queso casero, cebolla crujiente',        89.00, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80'),
  (10, 4, 'Refresco',          'Coca-Cola, Sprite o Fanta (330 ml)',                               29.00, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&q=80'),
  (11, 4, 'Agua Mineral',      'Agua con gas natural (500 ml)',                                    25.00, 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&q=80'),
  (12, 4, 'Malteada',          'Vainilla, chocolate o fresa — hecha al momento',                   59.00, 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=400&q=80');

-- ── Alérgenos / ingredientes especiales ──────────────────────
CREATE TABLE IF NOT EXISTS menu_item_allergens (
  id           INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT         UNSIGNED NOT NULL,
  name         VARCHAR(80) NOT NULL,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO menu_item_allergens (id, menu_item_id, name) VALUES
  (1,  1, 'Gluten'), (2,  1, 'Lácteos'),
  (3,  2, 'Gluten'), (4,  2, 'Lácteos'),
  (5,  3, 'Gluten'), (6,  3, 'Lácteos'),
  (7,  4, 'Gluten'), (8,  4, 'Picante'),
  (9,  5, 'Gluten'),
  (10, 6, 'Gluten'),
  (11, 7, 'Gluten'), (12, 7, 'Lácteos'),
  (13, 8, 'Gluten'), (14, 8, 'Mostaza'),
  (15, 9, 'Gluten'), (16, 9, 'Lácteos'),
  (17,12, 'Lácteos');

-- ── Modificadores predeterminados por categoría ──────────────
CREATE TABLE IF NOT EXISTS category_modifiers (
  id          INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT         UNSIGNED NOT NULL,
  name        VARCHAR(80) NOT NULL,
  sort_order  SMALLINT    UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO category_modifiers (id, category_id, name, sort_order) VALUES
  (1, 1,'LECHUGA',1),(2, 1,'JITOMATE',2),(3, 1,'MAYONESA',3),(4, 1,'PEPINILLOS ARTESANALES',4),
  (5, 1,'CEBOLLA ASADA',5),(6, 1,'MOSTAZA',6),(7, 1,'KETCHUP',7),(8, 1,'SALSA ESPECIAL',8),
  (9, 1,'QUESO EXTRA',9),(10, 1,'BACON EXTRA',10);

-- ── Turnos (shifts) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  start_hour  TINYINT      UNSIGNED NOT NULL,
  end_hour    TINYINT      UNSIGNED NOT NULL,
  date        DATE         NOT NULL,
  opened_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at   DATETIME,
  status      ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_by  INT          UNSIGNED,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (table_id) REFERENCES tables_restaurant(id),
  FOREIGN KEY (customer_type_id) REFERENCES customer_types(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Añadir tip si la tabla ya existía sin esa columna
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ── Items de orden ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT          UNSIGNED NOT NULL,
  menu_item_id INT          UNSIGNED NOT NULL,
  quantity     SMALLINT     UNSIGNED NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  notes        TEXT,
  status       ENUM('pending','cancelled') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Modificadores por item de orden ──────────────────────────
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

-- ── Gastos de shopping ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_expenses (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id  VARCHAR(40)  NOT NULL,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  receipt_url VARCHAR(255),
  closed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Índices (DROP IF EXISTS primero para que sea idempotente) ──
DROP INDEX IF EXISTS idx_orders_status   ON orders;
DROP INDEX IF EXISTS idx_orders_table    ON orders;
DROP INDEX IF EXISTS idx_orders_shift    ON orders;
DROP INDEX IF EXISTS idx_orders_created  ON orders;
DROP INDEX IF EXISTS idx_order_items_ord ON order_items;

CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_table    ON orders(table_id);
CREATE INDEX idx_orders_shift    ON orders(shift_id);
CREATE INDEX idx_orders_created  ON orders(created_at);
CREATE INDEX idx_order_items_ord ON order_items(order_id);
