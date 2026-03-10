-- Product Selection System Database Initialization Script
-- PostgreSQL
-- 码垛/拆垛工作站选型系统

-- ============================================
-- Drop existing tables (in reverse dependency order)
-- ============================================
DROP TABLE IF EXISTS session_selections CASCADE;
DROP TABLE IF EXISTS selection_sessions CASCADE;
DROP TABLE IF EXISTS auto_bindings CASCADE;
DROP TABLE IF EXISTS option_constraints CASCADE;
DROP TABLE IF EXISTS step_options CASCADE;
DROP TABLE IF EXISTS selection_steps CASCADE;
DROP TABLE IF EXISTS workstation_types CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- 工作站类型表 (码垛/拆垛)
-- ============================================
CREATE TABLE workstation_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 部件分类表
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 选型步骤表
-- ============================================
CREATE TABLE selection_steps (
    id SERIAL PRIMARY KEY,
    workstation_type_id INTEGER NOT NULL REFERENCES workstation_types(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    is_exclusive BOOLEAN DEFAULT TRUE,      -- 是否互斥（只能选一个）
    is_multiple BOOLEAN DEFAULT FALSE,      -- 是否可多选
    min_selections INTEGER DEFAULT 1,       -- 最少选择数量
    max_selections INTEGER DEFAULT 1,       -- 最多选择数量
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_selection_limit CHECK (max_selections >= min_selections),
    CONSTRAINT chk_multiple CHECK (NOT (is_exclusive AND is_multiple) OR NOT is_exclusive)
);

-- ============================================
-- 步骤选项表 (物料配置)
-- ============================================
CREATE TABLE step_options (
    id SERIAL PRIMARY KEY,
    step_id INTEGER NOT NULL REFERENCES selection_steps(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,             -- 物料名称
    model VARCHAR(100) NOT NULL,            -- 规格型号
    material_code VARCHAR(100) NOT NULL,    -- 系统物料编码
    category_code VARCHAR(50),              -- 分类编号
    description TEXT,
    specifications JSONB,                   -- 详细规格参数
    image_url VARCHAR(500),
    price DECIMAL(12, 2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT '件',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_step_option_model UNIQUE (step_id, model)
);

-- ============================================
-- 选项约束规则表 (联动过滤)
-- ============================================
CREATE TABLE option_constraints (
    id SERIAL PRIMARY KEY,
    step_id INTEGER NOT NULL REFERENCES selection_steps(id) ON DELETE CASCADE,
    depends_on_step_id INTEGER NOT NULL REFERENCES selection_steps(id) ON DELETE CASCADE,
    depends_on_option_id INTEGER REFERENCES step_options(id) ON DELETE CASCADE,  -- NULL表示依赖该步骤的任意选项
    constraint_type VARCHAR(50) DEFAULT 'filter',  -- filter(过滤), require(必须), exclude(排除)
    filter_values JSONB,                     -- 过滤条件
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 自动绑定规则表
-- ============================================
CREATE TABLE auto_bindings (
    id SERIAL PRIMARY KEY,
    trigger_option_id INTEGER NOT NULL REFERENCES step_options(id) ON DELETE CASCADE,
    bind_category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    bind_option_name VARCHAR(200),          -- 自动绑定的物料名称
    bind_option_model VARCHAR(100),          -- 自动绑定的规格型号
    bind_material_code VARCHAR(100),         -- 自动绑定的物料编码
    quantity INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 选型会话表
-- ============================================
CREATE TABLE selection_sessions (
    id VARCHAR(50) PRIMARY KEY,             -- UUID
    workstation_type_id INTEGER NOT NULL REFERENCES workstation_types(id) ON DELETE RESTRICT,
    employee_id VARCHAR(50) NOT NULL,       -- 工号
    employee_name VARCHAR(100) NOT NULL,    -- 姓名
    current_step INTEGER DEFAULT 1,         -- 当前步骤序号
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 会话选型记录表
-- ============================================
CREATE TABLE session_selections (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL REFERENCES selection_sessions(id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL REFERENCES selection_steps(id) ON DELETE RESTRICT,
    option_id INTEGER NOT NULL REFERENCES step_options(id) ON DELETE RESTRICT,
    is_auto_bound BOOLEAN DEFAULT FALSE,    -- 是否自动绑定
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_session_step_option UNIQUE (session_id, step_id, option_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_workstation_types_active ON workstation_types(is_active);
CREATE INDEX idx_selection_steps_workstation ON selection_steps(workstation_type_id);
CREATE INDEX idx_selection_steps_order ON selection_steps(workstation_type_id, step_order);
CREATE INDEX idx_step_options_step ON step_options(step_id);
CREATE INDEX idx_option_constraints_step ON option_constraints(step_id);
CREATE INDEX idx_option_constraints_depends ON option_constraints(depends_on_step_id);
CREATE INDEX idx_auto_bindings_trigger ON auto_bindings(trigger_option_id);
CREATE INDEX idx_selection_sessions_employee ON selection_sessions(employee_id);
CREATE INDEX idx_selection_sessions_status ON selection_sessions(status);
CREATE INDEX idx_selection_sessions_created ON selection_sessions(created_at);
CREATE INDEX idx_session_selections_session ON session_selections(session_id);

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
CREATE TRIGGER update_workstation_types_updated_at BEFORE UPDATE ON workstation_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selection_steps_updated_at BEFORE UPDATE ON selection_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_options_updated_at BEFORE UPDATE ON step_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selection_sessions_updated_at BEFORE UPDATE ON selection_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始化数据
-- ============================================

-- 工作站类型
INSERT INTO workstation_types (name, code, description, icon, sort_order) VALUES
('码垛工作站', 'PALLETIZING', '用于自动化码垛作业的工作站选型', 'appstore', 1),
('拆垛工作站', 'DEPALLETIZING', '用于自动化拆垛作业的工作站选型', 'appstore', 2);

-- 部件分类
INSERT INTO categories (name, code, description, icon, sort_order) VALUES
('机械臂', 'ROBOT_ARM', '工业机器人机械臂', 'robot', 1),
('集成车体', 'INTEGRATED_CART', '集成移动车体', 'car', 2),
('立柱', 'COLUMN', '支撑立柱组件', 'column', 3),
('抓手', 'GRIPPER', '末端执行器/抓手', 'hand', 4),
('管线包', 'CABLE_PACKAGE', '线缆管线包', 'api', 5),
('附属件', 'ACCESSORY', '附属配件', 'tool', 6),
('吸盘', 'SUCTION_CUP', '真空吸盘组件', 'eye', 7),
('夹具', 'CLAMP', '夹持工具', 'block', 8);

-- ============================================
-- 码垛工作站步骤配置
-- ============================================

-- 步骤1: 机械臂选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(1, 1, '机械臂选型', 1, '选择适合的工业机器人机械臂', TRUE, TRUE, FALSE, 1, 1);

-- 步骤2: 集成车体选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(1, 2, '集成车体选型', 2, '选择集成移动车体', TRUE, TRUE, FALSE, 1, 1);

-- 步骤3: 立柱选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(1, 3, '立柱选型', 3, '选择支撑立柱组件', TRUE, TRUE, FALSE, 1, 1);

-- 步骤4: 抓手选型 (非必选，可多选)
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(1, 4, '抓手选型', 4, '选择末端执行器/抓手（可选多个）', FALSE, FALSE, TRUE, 0, 5);

-- 步骤5: 管线包选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(1, 5, '管线包选型', 5, '选择线缆管线包（根据机械臂型号过滤）', TRUE, TRUE, FALSE, 1, 1);

-- ============================================
-- 拆垛工作站步骤配置
-- ============================================

-- 步骤1: 机械臂选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(2, 1, '机械臂选型', 1, '选择适合的工业机器人机械臂', TRUE, TRUE, FALSE, 1, 1);

-- 步骤2: 集成车体选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(2, 2, '集成车体选型', 2, '选择集成移动车体', TRUE, TRUE, FALSE, 1, 1);

-- 步骤3: 立柱选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(2, 3, '立柱选型', 3, '选择支撑立柱组件', TRUE, TRUE, FALSE, 1, 1);

-- 步骤4: 抓手选型 (非必选，可多选)
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(2, 4, '抓手选型', 4, '选择末端执行器/抓手（可选多个）', FALSE, FALSE, TRUE, 0, 5);

-- 步骤5: 管线包选型
INSERT INTO selection_steps (workstation_type_id, category_id, step_name, step_order, description, is_required, is_exclusive, is_multiple, min_selections, max_selections) VALUES
(2, 5, '管线包选型', 5, '选择线缆管线包（根据机械臂型号过滤）', TRUE, TRUE, FALSE, 1, 1);

-- ============================================
-- 机械臂选项 (步骤ID 1, 6)
-- ============================================

-- 码垛工作站机械臂 (step_id = 1)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(1, 'ABB IRB 4600', 'IRB 4600-60/2.05', 'MAT-ARM-001', 'ARM-ABB', 'ABB六轴机器人，负载60kg，臂展2.05m', 
 '{"负载": "60kg", "臂展": "2.05m", "重复定位精度": "±0.05mm", "防护等级": "IP67", "应用": "码垛/搬运"}', 280000.00),

(1, 'ABB IRB 6700', 'IRB 6700-150/3.20', 'MAT-ARM-002', 'ARM-ABB', 'ABB六轴机器人，负载150kg，臂展3.20m', 
 '{"负载": "150kg", "臂展": "3.20m", "重复定位精度": "±0.05mm", "防护等级": "IP67", "应用": "重型码垛"}', 450000.00),

(1, 'FANUC M-20iD', 'M-20iD/25', 'MAT-ARM-003', 'ARM-FANUC', 'FANUC六轴机器人，负载25kg，臂展1.85m', 
 '{"负载": "25kg", "臂展": "1.85m", "重复定位精度": "±0.02mm", "防护等级": "IP67", "应用": "高速码垛"}', 320000.00),

(1, 'KUKA KR 70 R2100', 'KR 70 R2100', 'MAT-ARM-004', 'ARM-KUKA', 'KUKA六轴机器人，负载70kg，臂展2.1m', 
 '{"负载": "70kg", "臂展": "2.1m", "重复定位精度": "±0.06mm", "防护等级": "IP65", "应用": "通用码垛"}', 380000.00),

(1, '安川GP88', 'GP88-2.0', 'MAT-ARM-005', 'ARM-YASKAWA', '安川六轴机器人，负载88kg，臂展2.0m', 
 '{"负载": "88kg", "臂展": "2.0m", "重复定位精度": "±0.07mm", "防护等级": "IP67", "应用": "标准码垛"}', 350000.00);

-- 拆垛工作站机械臂 (step_id = 6)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(6, 'ABB IRB 4600', 'IRB 4600-60/2.05', 'MAT-ARM-001', 'ARM-ABB', 'ABB六轴机器人，负载60kg，臂展2.05m', 
 '{"负载": "60kg", "臂展": "2.05m", "重复定位精度": "±0.05mm", "防护等级": "IP67", "应用": "拆垛/搬运"}', 280000.00),

(6, 'ABB IRB 6700', 'IRB 6700-150/3.20', 'MAT-ARM-002', 'ARM-ABB', 'ABB六轴机器人，负载150kg，臂展3.20m', 
 '{"负载": "150kg", "臂展": "3.20m", "重复定位精度": "±0.05mm", "防护等级": "IP67", "应用": "重型拆垛"}', 450000.00),

(6, 'FANUC M-20iD', 'M-20iD/25', 'MAT-ARM-003', 'ARM-FANUC', 'FANUC六轴机器人，负载25kg，臂展1.85m', 
 '{"负载": "25kg", "臂展": "1.85m", "重复定位精度": "±0.02mm", "防护等级": "IP67", "应用": "高速拆垛"}', 320000.00),

(6, 'KUKA KR 70 R2100', 'KR 70 R2100', 'MAT-ARM-004', 'ARM-KUKA', 'KUKA六轴机器人，负载70kg，臂展2.1m', 
 '{"负载": "70kg", "臂展": "2.1m", "重复定位精度": "±0.06mm", "防护等级": "IP65", "应用": "通用拆垛"}', 380000.00),

(6, '安川GP88', 'GP88-2.0', 'MAT-ARM-005', 'ARM-YASKAWA', '安川六轴机器人，负载88kg，臂展2.0m', 
 '{"负载": "88kg", "臂展": "2.0m", "重复定位精度": "±0.07mm", "防护等级": "IP67", "应用": "标准拆垛"}', 350000.00);

-- ============================================
-- 集成车体选项 (步骤ID 2, 7)
-- ============================================

-- 码垛工作站集成车体 (step_id = 2)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(2, '标准移动车体', 'MC-STD-01', 'MAT-CART-001', 'CART-STD', '标准尺寸移动车体，适用于中型码垛', 
 '{"尺寸": "2000x1500x1800mm", "承重": "500kg", "移动方式": "滚轮导轨", "控制系统": "内置PLC"}', 85000.00),

(2, '重型移动车体', 'MC-HVY-01', 'MAT-CART-002', 'CART-HVY', '重型移动车体，适用于大型码垛', 
 '{"尺寸": "2500x1800x2000mm", "承重": "1000kg", "移动方式": "滚轮导轨", "控制系统": "内置PLC"}', 120000.00),

(2, '轻型移动车体', 'MC-LT-01', 'MAT-CART-003', 'CART-LT', '轻型移动车体，适用于小型码垛', 
 '{"尺寸": "1500x1200x1500mm", "承重": "200kg", "移动方式": "滚轮导轨", "控制系统": "内置PLC"}', 55000.00);

-- 拆垛工作站集成车体 (step_id = 7)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(7, '标准移动车体', 'MC-STD-01', 'MAT-CART-001', 'CART-STD', '标准尺寸移动车体，适用于中型拆垛', 
 '{"尺寸": "2000x1500x1800mm", "承重": "500kg", "移动方式": "滚轮导轨", "控制系统": "内置PLC"}', 85000.00),

(7, '重型移动车体', 'MC-HVY-01', 'MAT-CART-002', 'CART-HVY', '重型移动车体，适用于大型拆垛', 
 '{"尺寸": "2500x1800x2000mm", "承重": "1000kg", "移动方式": "滚轮导轨", "控制系统": "内置PLC"}', 120000.00),

(7, '轻型移动车体', 'MC-LT-01', 'MAT-CART-003', 'CART-LT', '轻型移动车体，适用于小型拆垛', 
 '{"尺寸": "1500x1200x1500mm", "承重": "200kg", "移动方式": "滚轮导轨", "控制系统": "内置PLC"}', 55000.00);

-- ============================================
-- 立柱选项 (步骤ID 3, 8)
-- ============================================

-- 码垛工作站立柱 (step_id = 3)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(3, '标准立柱', 'COL-STD-2000', 'MAT-COL-001', 'COL-STD', '标准高度立柱，高度2m', 
 '{"高度": "2000mm", "材质": "碳钢", "表面处理": "喷塑", "调节范围": "±100mm"}', 15000.00),

(3, '加高立柱', 'COL-TALL-2500', 'MAT-COL-002', 'COL-TALL', '加高立柱，高度2.5m', 
 '{"高度": "2500mm", "材质": "碳钢", "表面处理": "喷塑", "调节范围": "±100mm"}', 18000.00),

(3, '超加高立柱', 'COL-XTALL-3000', 'MAT-COL-003', 'COL-XTALL', '超加高立柱，高度3m', 
 '{"高度": "3000mm", "材质": "碳钢", "表面处理": "喷塑", "调节范围": "±150mm"}', 22000.00);

-- 拆垛工作站立柱 (step_id = 8)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(8, '标准立柱', 'COL-STD-2000', 'MAT-COL-001', 'COL-STD', '标准高度立柱，高度2m', 
 '{"高度": "2000mm", "材质": "碳钢", "表面处理": "喷塑", "调节范围": "±100mm"}', 15000.00),

(8, '加高立柱', 'COL-TALL-2500', 'MAT-COL-002', 'COL-TALL', '加高立柱，高度2.5m', 
 '{"高度": "2500mm", "材质": "碳钢", "表面处理": "喷塑", "调节范围": "±100mm"}', 18000.00),

(8, '超加高立柱', 'COL-XTALL-3000', 'MAT-COL-003', 'COL-XTALL', '超加高立柱，高度3m', 
 '{"高度": "3000mm", "材质": "碳钢", "表面处理": "喷塑", "调节范围": "±150mm"}', 22000.00);

-- ============================================
-- 抓手选项 (步骤ID 4, 9) - 可多选
-- ============================================

-- 码垛工作站抓手 (step_id = 4)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(4, '真空吸盘抓手', 'GRP-VAC-01', 'MAT-GRP-001', 'GRP-VAC', '真空吸盘式抓手，适用于箱类物品', 
 '{"吸盘数量": "8个", "吸盘直径": "50mm", "最大负载": "30kg", "适用物品": "纸箱/木箱"}', 25000.00),

(4, '气动夹爪', 'GRP-CLP-01', 'MAT-GRP-002', 'GRP-CLP', '气动夹持抓手，适用于袋装物品', 
 '{"夹持范围": "50-400mm", "夹持力": "500N", "最大负载": "50kg", "适用物品": "袋装/箱装"}', 35000.00),

(4, '磁性抓手', 'GRP-MAG-01', 'MAT-GRP-003', 'GRP-MAG', '电磁磁性抓手，适用于金属物品', 
 '{"磁力": "500kg", "最大负载": "100kg", "适用物品": "金属板/金属件"}', 45000.00),

(4, '海绵吸盘', 'GRP-SPG-01', 'MAT-GRP-004', 'GRP-SPG', '海绵吸盘抓手，适用于表面不平整物品', 
 '{"吸盘尺寸": "300x200mm", "最大负载": "20kg", "适用物品": "不规则表面"}', 28000.00),

(4, '叉式抓手', 'GRP-FRK-01', 'MAT-GRP-005', 'GRP-FRK', '叉式抓手，适用于托盘物品', 
 '{"叉齿长度": "500mm", "最大负载": "150kg", "适用物品": "托盘货物"}', 38000.00);

-- 拆垛工作站抓手 (step_id = 9)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(9, '真空吸盘抓手', 'GRP-VAC-01', 'MAT-GRP-001', 'GRP-VAC', '真空吸盘式抓手，适用于箱类物品', 
 '{"吸盘数量": "8个", "吸盘直径": "50mm", "最大负载": "30kg", "适用物品": "纸箱/木箱"}', 25000.00),

(9, '气动夹爪', 'GRP-CLP-01', 'MAT-GRP-002', 'GRP-CLP', '气动夹持抓手，适用于袋装物品', 
 '{"夹持范围": "50-400mm", "夹持力": "500N", "最大负载": "50kg", "适用物品": "袋装/箱装"}', 35000.00),

(9, '磁性抓手', 'GRP-MAG-01', 'MAT-GRP-003', 'GRP-MAG', '电磁磁性抓手，适用于金属物品', 
 '{"磁力": "500kg", "最大负载": "100kg", "适用物品": "金属板/金属件"}', 45000.00),

(9, '海绵吸盘', 'GRP-SPG-01', 'MAT-GRP-004', 'GRP-SPG', '海绵吸盘抓手，适用于表面不平整物品', 
 '{"吸盘尺寸": "300x200mm", "最大负载": "20kg", "适用物品": "不规则表面"}', 28000.00),

(9, '叉式抓手', 'GRP-FRK-01', 'MAT-GRP-005', 'GRP-FRK', '叉式抓手，适用于托盘物品', 
 '{"叉齿长度": "500mm", "最大负载": "150kg", "适用物品": "托盘货物"}', 38000.00);

-- ============================================
-- 管线包选项 (步骤ID 5, 10)
-- ============================================

-- 码垛工作站管线包 (step_id = 5)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
-- ABB机械臂适配管线包
(5, 'ABB标准管线包', 'CP-ABB-STD', 'MAT-CP-001', 'CP-ABB', 'ABB机械臂标准管线包', 
 '{"适用机械臂": "ABB", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 12000.00),

(5, 'ABB加长管线包', 'CP-ABB-LNG', 'MAT-CP-002', 'CP-ABB', 'ABB机械臂加长管线包', 
 '{"适用机械臂": "ABB", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 15000.00),

-- FANUC机械臂适配管线包
(5, 'FANUC标准管线包', 'CP-FNC-STD', 'MAT-CP-003', 'CP-FANUC', 'FANUC机械臂标准管线包', 
 '{"适用机械臂": "FANUC", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 11000.00),

(5, 'FANUC加长管线包', 'CP-FNC-LNG', 'MAT-CP-004', 'CP-FANUC', 'FANUC机械臂加长管线包', 
 '{"适用机械臂": "FANUC", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 14000.00),

-- KUKA机械臂适配管线包
(5, 'KUKA标准管线包', 'CP-KUK-STD', 'MAT-CP-005', 'CP-KUKA', 'KUKA机械臂标准管线包', 
 '{"适用机械臂": "KUKA", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 11500.00),

(5, 'KUKA加长管线包', 'CP-KUK-LNG', 'MAT-CP-006', 'CP-KUKA', 'KUKA机械臂加长管线包', 
 '{"适用机械臂": "KUKA", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 14500.00),

-- 安川机械臂适配管线包
(5, '安川标准管线包', 'CP-YSK-STD', 'MAT-CP-007', 'CP-YASKAWA', '安川机械臂标准管线包', 
 '{"适用机械臂": "安川", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 10500.00),

(5, '安川加长管线包', 'CP-YSK-LNG', 'MAT-CP-008', 'CP-YASKAWA', '安川机械臂加长管线包', 
 '{"适用机械臂": "安川", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 13500.00);

-- 拆垛工作站管线包 (step_id = 10)
INSERT INTO step_options (step_id, name, model, material_code, category_code, description, specifications, price) VALUES
(10, 'ABB标准管线包', 'CP-ABB-STD', 'MAT-CP-001', 'CP-ABB', 'ABB机械臂标准管线包', 
 '{"适用机械臂": "ABB", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 12000.00),

(10, 'ABB加长管线包', 'CP-ABB-LNG', 'MAT-CP-002', 'CP-ABB', 'ABB机械臂加长管线包', 
 '{"适用机械臂": "ABB", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 15000.00),

(10, 'FANUC标准管线包', 'CP-FNC-STD', 'MAT-CP-003', 'CP-FANUC', 'FANUC机械臂标准管线包', 
 '{"适用机械臂": "FANUC", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 11000.00),

(10, 'FANUC加长管线包', 'CP-FNC-LNG', 'MAT-CP-004', 'CP-FANUC', 'FANUC机械臂加长管线包', 
 '{"适用机械臂": "FANUC", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 14000.00),

(10, 'KUKA标准管线包', 'CP-KUK-STD', 'MAT-CP-005', 'CP-KUKA', 'KUKA机械臂标准管线包', 
 '{"适用机械臂": "KUKA", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 11500.00),

(10, 'KUKA加长管线包', 'CP-KUK-LNG', 'MAT-CP-006', 'CP-KUKA', 'KUKA机械臂加长管线包', 
 '{"适用机械臂": "KUKA", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 14500.00),

(10, '安川标准管线包', 'CP-YSK-STD', 'MAT-CP-007', 'CP-YASKAWA', '安川机械臂标准管线包', 
 '{"适用机械臂": "安川", "线缆类型": "动力+信号+气路", "长度": "标准", "防护等级": "IP65"}', 10500.00),

(10, '安川加长管线包', 'CP-YSK-LNG', 'MAT-CP-008', 'CP-YASKAWA', '安川机械臂加长管线包', 
 '{"适用机械臂": "安川", "线缆类型": "动力+信号+气路", "长度": "加长", "防护等级": "IP65"}', 13500.00);

-- ============================================
-- 选项约束规则 (联动过滤)
-- ============================================

-- 管线包根据机械臂品牌过滤
-- 码垛工作站：步骤5(管线包) 依赖 步骤1(机械臂)
INSERT INTO option_constraints (step_id, depends_on_step_id, constraint_type, filter_values, description) VALUES
-- ABB机械臂 → 只显示ABB管线包
(5, 1, 'filter', '{"category_code": "CP-ABB"}', 'ABB机械臂只能选择ABB管线包'),
(5, 1, 'require', NULL, '必须选择机械臂后才能选择管线包');

-- 拆垛工作站：步骤10(管线包) 依赖 步骤6(机械臂)
INSERT INTO option_constraints (step_id, depends_on_step_id, constraint_type, filter_values, description) VALUES
(10, 6, 'filter', '{"category_code": "CP-ABB"}', 'ABB机械臂只能选择ABB管线包'),
(10, 6, 'require', NULL, '必须选择机械臂后才能选择管线包');

-- ============================================
-- 自动绑定规则
-- ============================================

-- 选择真空吸盘抓手 → 自动绑定转接板
INSERT INTO auto_bindings (trigger_option_id, bind_category_id, bind_option_name, bind_option_model, bind_material_code, quantity, description) VALUES
-- 码垛站
((SELECT id FROM step_options WHERE model = 'GRP-VAC-01' AND step_id = 4), 
 (SELECT id FROM categories WHERE code = 'ACCESSORY'), 
 '真空吸盘转接板', 'ADP-VAC-01', 'MAT-ADP-001', 1, '真空吸盘配套转接板'),

((SELECT id FROM step_options WHERE model = 'GRP-SPG-01' AND step_id = 4), 
 (SELECT id FROM categories WHERE code = 'ACCESSORY'), 
 '海绵吸盘转接板', 'ADP-SPG-01', 'MAT-ADP-002', 1, '海绵吸盘配套转接板'),

-- 拆垛站
((SELECT id FROM step_options WHERE model = 'GRP-VAC-01' AND step_id = 9), 
 (SELECT id FROM categories WHERE code = 'ACCESSORY'), 
 '真空吸盘转接板', 'ADP-VAC-01', 'MAT-ADP-001', 1, '真空吸盘配套转接板'),

((SELECT id FROM step_options WHERE model = 'GRP-SPG-01' AND step_id = 9), 
 (SELECT id FROM categories WHERE code = 'ACCESSORY'), 
 '海绵吸盘转接板', 'ADP-SPG-01', 'MAT-ADP-002', 1, '海绵吸盘配套转接板');

-- ============================================
-- Views
-- ============================================

-- 工作站步骤视图
CREATE VIEW v_workstation_steps AS
SELECT 
    ws.id AS workstation_id,
    ws.name AS workstation_name,
    ws.code AS workstation_code,
    ss.id AS step_id,
    ss.step_name,
    ss.step_order,
    ss.is_required,
    ss.is_exclusive,
    ss.is_multiple,
    ss.min_selections,
    ss.max_selections,
    c.id AS category_id,
    c.name AS category_name,
    c.code AS category_code
FROM workstation_types ws
JOIN selection_steps ss ON ws.id = ss.workstation_type_id
JOIN categories c ON ss.category_id = c.id
WHERE ws.is_active = TRUE AND ss.is_active = TRUE
ORDER BY ws.id, ss.step_order;

-- 步骤选项视图
CREATE VIEW v_step_options AS
SELECT 
    ss.id AS step_id,
    ss.step_name,
    ss.workstation_type_id,
    so.id AS option_id,
    so.name AS option_name,
    so.model,
    so.material_code,
    so.category_code,
    so.description,
    so.specifications,
    so.price,
    so.unit
FROM selection_steps ss
JOIN step_options so ON ss.id = so.step_id
WHERE ss.is_active = TRUE AND so.is_active = TRUE
ORDER BY ss.step_order, so.sort_order;

-- 选型会话详情视图
CREATE VIEW v_session_detail AS
SELECT 
    ss.id AS session_id,
    ss.employee_id,
    ss.employee_name,
    ws.name AS workstation_name,
    ws.code AS workstation_code,
    ss.current_step,
    ss.status,
    ss.created_at,
    ss.completed_at,
    COUNT(sel.id) AS selection_count
FROM selection_sessions ss
JOIN workstation_types ws ON ss.workstation_type_id = ws.id
LEFT JOIN session_selections sel ON ss.id = sel.session_id
GROUP BY ss.id, ws.name, ws.code;

-- ============================================
-- Functions
-- ============================================

-- 生成会话ID
CREATE OR REPLACE FUNCTION generate_session_id()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'SS' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 获取下一步骤选项（支持联动过滤）
CREATE OR REPLACE FUNCTION get_step_options(
    p_session_id VARCHAR(50),
    p_step_id INTEGER
)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(200),
    model VARCHAR(100),
    material_code VARCHAR(100),
    category_code VARCHAR(50),
    description TEXT,
    specifications JSONB,
    price DECIMAL(12, 2),
    unit VARCHAR(20),
    is_filtered BOOLEAN
) AS $$
DECLARE
    v_workstation_type_id INTEGER;
    v_previous_selections JSONB;
BEGIN
    -- 获取会话的工作站类型
    SELECT workstation_type_id INTO v_workstation_type_id
    FROM selection_sessions WHERE id = p_session_id;
    
    -- 获取前面步骤的选择（用于过滤）
    SELECT jsonb_agg(jsonb_build_object('step_id', sel.step_id, 'option_id', sel.option_id))
    INTO v_previous_selections
    FROM session_selections sel
    JOIN selection_steps ss ON sel.step_id = ss.id
    WHERE sel.session_id = p_session_id;
    
    -- 返回选项，标记是否被过滤
    RETURN QUERY
    SELECT 
        so.id,
        so.name,
        so.model,
        so.material_code,
        so.category_code,
        so.description,
        so.specifications,
        so.price,
        so.unit,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM option_constraints oc
                WHERE oc.step_id = p_step_id
                AND oc.constraint_type = 'filter'
                AND oc.filter_values IS NOT NULL
                AND NOT (
                    so.category_code = (oc.filter_values->>'category_code')
                    OR so.specifications ? (oc.filter_values->>'spec_key')
                )
            ) THEN TRUE
            ELSE FALSE
        END AS is_filtered;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- End of initialization script
-- ============================================