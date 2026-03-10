-- Product Selection System Database Initialization Script
-- PostgreSQL

-- ============================================
-- Drop existing tables (in reverse dependency order)
-- ============================================
DROP TABLE IF EXISTS selection_config_params CASCADE;
DROP TABLE IF EXISTS selection_configs CASCADE;
DROP TABLE IF EXISTS product_parameters CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Product Categories Table
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Products Table
-- ============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    specifications JSONB,
    image_url VARCHAR(500),
    price DECIMAL(12, 2),
    unit VARCHAR(20) DEFAULT '件',
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Product Parameters Table
-- ============================================
CREATE TABLE product_parameters (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    param_name VARCHAR(100) NOT NULL,
    param_value VARCHAR(255) NOT NULL,
    param_unit VARCHAR(50),
    param_type VARCHAR(50) DEFAULT 'string' CHECK (param_type IN ('string', 'number', 'boolean', 'select')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Selection Configs Table (选型配置主表)
-- ============================================
CREATE TABLE selection_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    total_price DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Selection Config Params Table (选型配置参数明细)
-- ============================================
CREATE TABLE selection_config_params (
    id SERIAL PRIMARY KEY,
    config_id INTEGER NOT NULL REFERENCES selection_configs(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    param_name VARCHAR(100) NOT NULL,
    param_value VARCHAR(255),
    param_unit VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    remarks TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_model ON products(model);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_product_params_product ON product_parameters(product_id);
CREATE INDEX idx_selection_configs_user ON selection_configs(user_id);
CREATE INDEX idx_selection_configs_status ON selection_configs(status);
CREATE INDEX idx_selection_config_params_config ON selection_config_params(config_id);

-- ============================================
-- Update timestamp trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selection_configs_updated_at BEFORE UPDATE ON selection_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Data
-- ============================================

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO.1BoWBPfGK2a', 'admin');

-- Insert sample categories
INSERT INTO categories (name, code, description, sort_order) VALUES
('PLC控制器', 'plc', '可编程逻辑控制器', 1),
('传感器', 'sensor', '各类传感器设备', 2),
('执行器', 'actuator', '电机、气缸等执行设备', 3),
('人机界面', 'hmi', '触摸屏、工控机等', 4),
('工业通信', 'comm', '通信模块、网关等', 5);

-- Insert sample products
INSERT INTO products (category_id, name, model, description, price, stock) VALUES
(1, '西门子 S7-1200', '6ES7 214-1AG40-0XB0', 'CPU 1214C DC/DC/DC', 3500.00, 100),
(1, '西门子 S7-1500', '6ES7 511-1AK01-0AB0', 'CPU 1511-1 PN', 8500.00, 50),
(2, '光电传感器', 'E3Z-D62', 'NPN 常开型', 180.00, 500),
(2, '接近传感器', 'E2E-X2ME1', 'M12 电感式', 120.00, 300),
(3, '伺服电机', 'MSM030B-0300-NF', '750W 伺服电机', 2800.00, 80),
(4, '触摸屏 TP700', '6AV2 124-0GC01-0AX0', '7寸触摸屏', 3200.00, 60);

-- Insert sample product parameters
INSERT INTO product_parameters (product_id, param_name, param_value, param_unit, param_type) VALUES
(1, 'CPU类型', '1214C', NULL, 'string'),
(1, '输入点数', '14', '点', 'number'),
(1, '输出点数', '10', '点', 'number'),
(1, '工作电压', '24', 'VDC', 'number'),
(1, '程序存储区', '100', 'KB', 'number'),
(2, 'CPU类型', '1511-1', NULL, 'string'),
(2, 'PROFINET接口', '2', '个', 'number'),
(2, '工作电压', '24', 'VDC', 'number'),
(3, '检测距离', '30', 'mm', 'number'),
(3, '输出类型', 'NPN', NULL, 'string'),
(3, '响应时间', '1', 'ms', 'number');

-- ============================================
-- Views
-- ============================================

-- Product detail view with category name
CREATE VIEW v_product_detail AS
SELECT 
    p.id,
    p.name,
    p.model,
    p.description,
    p.price,
    p.unit,
    p.stock,
    p.is_active,
    c.id AS category_id,
    c.name AS category_name,
    c.code AS category_code,
    p.specifications,
    p.image_url,
    p.created_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Selection config detail view
CREATE VIEW v_selection_config_detail AS
SELECT 
    sc.id,
    sc.name,
    sc.description,
    sc.status,
    sc.total_price,
    sc.created_at,
    sc.updated_at,
    u.username,
    u.email
FROM selection_configs sc
LEFT JOIN users u ON sc.user_id = u.id;

-- ============================================
-- Grant permissions (adjust as needed)
-- ============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO product_selection;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO product_selection;

-- ============================================
-- End of initialization script
-- ============================================