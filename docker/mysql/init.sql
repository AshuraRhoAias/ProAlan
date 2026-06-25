-- ============================================================
-- MastrFlow — Database Schema
-- Charset: utf8mb4 (soporta ñ, acentos, emojis y todo unicode)
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

INSERT INTO restaurant (name) VALUES ('My Restaurant');

-- ── Customer Types (DIRECT, DIDI, UBER, RAPPI, MOB+, etc.) ──
CREATE TABLE IF NOT EXISTS customer_types (
  id         INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(40) NOT NULL,
  color      VARCHAR(10) NOT NULL DEFAULT '#6b7280',
  sort_order SMALLINT    UNSIGNED NOT NULL DEFAULT 0,
  active     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO customer_types (name, color, sort_order) VALUES
  ('DIRECT', '#6b7280', 1),
  ('DIDI',   '#f59e0b', 2),
  ('UBER',   '#10b981', 3),
  ('RAPPI',  '#ef4444', 4),
  ('MOB+',   '#8b5cf6', 5);

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

INSERT INTO users (name, role, pin) VALUES
  ('Admin', 'admin', '0000'),
  ('Manager', 'manager', '1234');

-- ── Mesas ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables_restaurant (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  capacity   SMALLINT     UNSIGNED NOT NULL DEFAULT 4,
  status     ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tables_restaurant (name, capacity) VALUES
  ('Table 1', 4), ('Table 2', 4), ('Table 3', 4),
  ('Table 4', 4), ('Table 5', 4), ('Table 6', 4);

-- ── Categorías de menú ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  sort_order SMALLINT     UNSIGNED NOT NULL DEFAULT 0,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO menu_categories (name, sort_order) VALUES
  ('Burgers', 1), ('Sides', 2), ('Mains', 3), ('Drinks', 4);

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

-- ── Alérgenos / ingredientes especiales ──────────────────────
CREATE TABLE IF NOT EXISTS menu_item_allergens (
  id           INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT         UNSIGNED NOT NULL,
  name         VARCHAR(80) NOT NULL,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Modificadores predeterminados por categoría ──────────────
CREATE TABLE IF NOT EXISTS category_modifiers (
  id          INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT         UNSIGNED NOT NULL,
  name        VARCHAR(80) NOT NULL,
  sort_order  SMALLINT    UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO category_modifiers (category_id, name, sort_order) VALUES
  (1,'LECHUGA',1),(1,'JITOMATE',2),(1,'MAYONESA',3),(1,'PEPINILLOS ARTESANALES',4),
  (1,'CEBOLLA ASADA',5),(1,'MOSTAZA',6),(1,'KETCHUP',7),(1,'SALSA ESPECIAL',8),
  (1,'QUESO EXTRA',9),(1,'BACON EXTRA',10);

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
  cancelled_value  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at       DATETIME,
  ready_at         DATETIME,
  closed_at        DATETIME,
  FOREIGN KEY (table_id) REFERENCES tables_restaurant(id),
  FOREIGN KEY (customer_type_id) REFERENCES customer_types(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Índices útiles
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_table    ON orders(table_id);
CREATE INDEX idx_orders_shift    ON orders(shift_id);
CREATE INDEX idx_orders_created  ON orders(created_at);
CREATE INDEX idx_order_items_ord ON order_items(order_id);
