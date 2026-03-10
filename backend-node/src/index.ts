import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { query, transaction } from './db';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ============================================
// API 接口
// ============================================

// 获取工作站类型列表
app.get('/api/workstation-types', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT id, name, code, description, icon
      FROM workstation_types
      WHERE is_active = TRUE
      ORDER BY sort_order, id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('获取工作站类型失败:', error);
    res.status(500).json({ error: '获取工作站类型失败' });
  }
});

// 获取指定工作站的选型步骤
app.get('/api/workstation/:id/steps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        ss.id,
        ss.step_name,
        ss.step_order,
        ss.is_required,
        ss.is_exclusive,
        ss.is_multiple,
        ss.min_selections,
        ss.max_selections,
        c.name as category_name,
        c.code as category_code
      FROM selection_steps ss
      JOIN categories c ON ss.category_id = c.id
      WHERE ss.workstation_type_id = $1 AND ss.is_active = TRUE
      ORDER BY ss.step_order
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('获取选型步骤失败:', error);
    res.status(500).json({ error: '获取选型步骤失败' });
  }
});

// 获取指定步骤的选项（支持联动过滤）
app.get('/api/steps/:id/options', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { session_id } = req.query;
    
    // 获取该步骤的所有选项
    const optionsResult = await query(`
      SELECT 
        id, name, model, material_code, category_code, 
        description, specifications, price, unit
      FROM step_options
      WHERE step_id = $1 AND is_active = TRUE
      ORDER BY sort_order, id
    `, [id]);
    
    let options = optionsResult.rows;
    
    // 如果有 session_id，处理联动过滤
    if (session_id) {
      // 获取该步骤的约束规则
      const constraintsResult = await query(`
        SELECT 
          oc.depends_on_step_id,
          oc.constraint_type,
          oc.filter_values
        FROM option_constraints oc
        WHERE oc.step_id = $1
      `, [id]);
      
      const constraints = constraintsResult.rows;
      
      if (constraints.length > 0) {
        // 获取会话中之前步骤的选择
        const selectionsResult = await query(`
          SELECT sel.step_id, sel.option_id, so.category_code as option_category
          FROM session_selections sel
          JOIN step_options so ON sel.option_id = so.id
          WHERE sel.session_id = $1
        `, [session_id]);
        
        const selections = selectionsResult.rows;
        
        // 处理过滤规则
        for (const constraint of constraints) {
          if (constraint.constraint_type === 'filter' && constraint.filter_values) {
            // 查找依赖步骤的选择
            const depSelection = selections.find(s => s.step_id === constraint.depends_on_step_id);
            
            if (depSelection) {
              const filterValues = constraint.filter_values;
              const filterCategory = filterValues.category_code;
              
              // 如果选择的是特定品牌机械臂，则过滤对应的管线包
              if (filterCategory) {
                // 获取选中机械臂的品牌信息
                const armResult = await query(`
                  SELECT category_code, specifications
                  FROM step_options
                  WHERE id = $1
                `, [depSelection.option_id]);
                
                if (armResult.rows.length > 0) {
                  const armCategory = armResult.rows[0].category_code;
                  const armSpecs = armResult.rows[0].specifications || {};
                  
                  // 根据机械臂品牌确定管线包分类
                  let cableCategory = '';
                  if (armCategory === 'ARM-ABB') {
                    cableCategory = 'CP-ABB';
                  } else if (armCategory === 'ARM-FANUC') {
                    cableCategory = 'CP-FANUC';
                  } else if (armCategory === 'ARM-KUKA') {
                    cableCategory = 'CP-KUKA';
                  } else if (armCategory === 'ARM-YASKAWA') {
                    cableCategory = 'CP-YASKAWA';
                  }
                  
                  // 标记不匹配的选项为已过滤
                  if (cableCategory) {
                    options = options.map(opt => ({
                      ...opt,
                      is_filtered: opt.category_code !== cableCategory
                    }));
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 确保 is_filtered 字段存在
    options = options.map(opt => ({
      ...opt,
      is_filtered: opt.is_filtered || false,
      specifications: opt.specifications || {}
    }));
    
    res.json(options);
  } catch (error) {
    console.error('获取步骤选项失败:', error);
    res.status(500).json({ error: '获取步骤选项失败' });
  }
});

// 创建选型会话
app.post('/api/session', async (req: Request, res: Response) => {
  try {
    const { employee_id, employee_name, workstation_type_id } = req.body;
    
    if (!employee_id || !employee_name || !workstation_type_id) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const session_id = `SS${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    await query(`
      INSERT INTO selection_sessions (id, workstation_type_id, employee_id, employee_name, current_step, status)
      VALUES ($1, $2, $3, $4, 1, 'pending')
    `, [session_id, workstation_type_id, employee_id, employee_name]);
    
    res.json({ session_id });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({ error: '创建会话失败' });
  }
});

// 保存当前步骤选择
app.post('/api/session/:id/select', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { step_id, option_ids } = req.body;
    
    if (!step_id || !Array.isArray(option_ids)) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const result = await transaction(async (client) => {
      // 删除该步骤之前的选型
      await client.query(`
        DELETE FROM session_selections
        WHERE session_id = $1 AND step_id = $2
      `, [id, step_id]);
      
      // 插入新的选择
      for (const option_id of option_ids) {
        await client.query(`
          INSERT INTO session_selections (session_id, step_id, option_id, is_auto_bound, quantity)
          VALUES ($1, $2, $3, FALSE, 1)
        `, [id, step_id, option_id]);
      }
      
      // 查找自动绑定规则
      const autoBindings: any[] = [];
      
      for (const option_id of option_ids) {
        const bindingsResult = await client.query(`
          SELECT 
            ab.id,
            ab.bind_option_name,
            ab.bind_option_model,
            ab.bind_material_code,
            ab.quantity,
            c.name as category_name
          FROM auto_bindings ab
          JOIN categories c ON ab.bind_category_id = c.id
          WHERE ab.trigger_option_id = $1
        `, [option_id]);
        
        for (const binding of bindingsResult.rows) {
          // 检查是否已经存在相同的自动绑定
          const existingResult = await client.query(`
            SELECT id FROM session_selections
            WHERE session_id = $1 AND option_id IN (
              SELECT id FROM step_options WHERE material_code = $2
            )
          `, [id, binding.bind_material_code]);
          
          if (existingResult.rows.length === 0) {
            // 查找或创建自动绑定的选项
            let bindOptionResult = await client.query(`
              SELECT id FROM step_options
              WHERE material_code = $1
            `, [binding.bind_material_code]);
            
            let bind_option_id;
            if (bindOptionResult.rows.length > 0) {
              bind_option_id = bindOptionResult.rows[0].id;
            } else {
              // 如果不存在，创建一个临时选项（或插入到附属件步骤）
              const accessoryStepResult = await client.query(`
                SELECT ss.id 
                FROM selection_steps ss
                JOIN categories c ON ss.category_id = c.id
                WHERE c.code = 'ACCESSORY' AND ss.workstation_type_id = (
                  SELECT workstation_type_id FROM selection_sessions WHERE id = $1
                )
              `, [id]);
              
              if (accessoryStepResult.rows.length > 0) {
                const insertResult = await client.query(`
                  INSERT INTO step_options (step_id, name, model, material_code, category_code, description, price)
                  VALUES ($1, $2, $3, $4, 'ACCESSORY', $5, 0)
                  RETURNING id
                `, [accessoryStepResult.rows[0].id, binding.bind_option_name, binding.bind_option_model, binding.bind_material_code, binding.bind_option_name]);
                bind_option_id = insertResult.rows[0].id;
              }
            }
            
            if (bind_option_id) {
              await client.query(`
                INSERT INTO session_selections (session_id, step_id, option_id, is_auto_bound, quantity)
                SELECT $1, step_id, $2, TRUE, $3
                FROM step_options WHERE id = $2
                ON CONFLICT (session_id, step_id, option_id) DO NOTHING
              `, [id, bind_option_id, binding.quantity]);
              
              autoBindings.push({
                name: binding.bind_option_name,
                model: binding.bind_option_model,
                material_code: binding.bind_material_code,
                quantity: binding.quantity
              });
            }
          }
        }
      }
      
      // 更新会话的当前步骤
      await client.query(`
        UPDATE selection_sessions
        SET current_step = (
          SELECT COALESCE(MAX(ss.step_order), 1) + 1
          FROM session_selections sel
          JOIN selection_steps ss ON sel.step_id = ss.id
          WHERE sel.session_id = $1
        ), updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
      
      return autoBindings;
    });
    
    res.json({ success: true, auto_bindings: result });
  } catch (error) {
    console.error('保存选择失败:', error);
    res.status(500).json({ error: '保存选择失败' });
  }
});

// 获取选型结果
app.get('/api/session/:id/result', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const selectionsResult = await query(`
      SELECT 
        ss.id as step_id,
        ss.step_name,
        ss.step_order,
        so.id as option_id,
        so.name as option_name,
        so.model,
        so.material_code,
        so.category_code,
        so.description,
        so.specifications,
        so.price,
        so.unit,
        sel.is_auto_bound,
        sel.quantity
      FROM session_selections sel
      JOIN selection_steps ss ON sel.step_id = ss.id
      JOIN step_options so ON sel.option_id = so.id
      WHERE sel.session_id = $1
      ORDER BY ss.step_order, sel.is_auto_bound, so.id
    `, [id]);
    
    const selections = selectionsResult.rows.map(row => ({
      step_id: row.step_id,
      step_name: row.step_name,
      step_order: row.step_order,
      option_id: row.option_id,
      option_name: row.option_name,
      model: row.model,
      material_code: row.material_code,
      category_code: row.category_code,
      description: row.description,
      specifications: row.specifications || {},
      price: parseFloat(row.price) || 0,
      unit: row.unit,
      is_auto_bound: row.is_auto_bound,
      quantity: row.quantity
    }));
    
    const total_price = selections.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    res.json({ selections, total_price });
  } catch (error) {
    console.error('获取选型结果失败:', error);
    res.status(500).json({ error: '获取选型结果失败' });
  }
});

// 获取历史记录
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const { employee_id } = req.query;
    
    let queryText = `
      SELECT 
        s.id as session_id,
        s.employee_id,
        s.employee_name,
        w.name as workstation_name,
        s.created_at,
        s.status,
        (SELECT COUNT(*) FROM session_selections WHERE session_id = s.id) as item_count
      FROM selection_sessions s
      JOIN workstation_types w ON s.workstation_type_id = w.id
    `;
    
    const params: any[] = [];
    if (employee_id) {
      queryText += ' WHERE s.employee_id = $1';
      params.push(employee_id);
    }
    
    queryText += ' ORDER BY s.created_at DESC LIMIT 100';
    
    const result = await query(queryText, params);
    
    const history = result.rows.map(row => ({
      session_id: row.session_id,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      workstation_name: row.workstation_name,
      created_at: row.created_at,
      status: row.status,
      item_count: parseInt(row.item_count) || 0
    }));
    
    res.json(history);
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// 获取历史详情
app.get('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 获取会话基本信息
    const sessionResult = await query(`
      SELECT 
        s.id,
        s.employee_id,
        s.employee_name,
        s.status,
        s.created_at,
        s.completed_at,
        w.name as workstation_name,
        w.code as workstation_code
      FROM selection_sessions s
      JOIN workstation_types w ON s.workstation_type_id = w.id
      WHERE s.id = $1
    `, [id]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }
    
    const session = sessionResult.rows[0];
    
    // 获取选型详情
    const selectionsResult = await query(`
      SELECT 
        ss.step_name,
        ss.step_order,
        so.name as option_name,
        so.model,
        so.material_code,
        so.category_code,
        so.description,
        so.specifications,
        so.price,
        so.unit,
        sel.is_auto_bound,
        sel.quantity
      FROM session_selections sel
      JOIN selection_steps ss ON sel.step_id = ss.id
      JOIN step_options so ON sel.option_id = so.id
      WHERE sel.session_id = $1
      ORDER BY ss.step_order, sel.is_auto_bound, so.id
    `, [id]);
    
    const selections = selectionsResult.rows.map(row => ({
      step_name: row.step_name,
      step_order: row.step_order,
      option_name: row.option_name,
      model: row.model,
      material_code: row.material_code,
      category_code: row.category_code,
      description: row.description,
      specifications: row.specifications || {},
      price: parseFloat(row.price) || 0,
      unit: row.unit,
      is_auto_bound: row.is_auto_bound,
      quantity: row.quantity
    }));
    
    const total_price = selections.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    res.json({
      ...session,
      selections,
      total_price
    });
  } catch (error) {
    console.error('获取历史详情失败:', error);
    res.status(500).json({ error: '获取历史详情失败' });
  }
});

// 完成选型
app.post('/api/session/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await query(`
      UPDATE selection_sessions
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('完成选型失败:', error);
    res.status(500).json({ error: '完成选型失败' });
  }
});

// 删除选型记录
app.delete('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await query(`
      DELETE FROM selection_sessions WHERE id = $1
    `, [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除选型记录失败:', error);
    res.status(500).json({ error: '删除选型记录失败' });
  }
});

// 获取当前会话信息
app.get('/api/session/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        s.id,
        s.employee_id,
        s.employee_name,
        s.current_step,
        s.status,
        w.id as workstation_type_id,
        w.name as workstation_name,
        w.code as workstation_code
      FROM selection_sessions s
      JOIN workstation_types w ON s.workstation_type_id = w.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '会话不存在' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取会话信息失败:', error);
    res.status(500).json({ error: '获取会话信息失败' });
  }
});

// 获取会话当前步骤的选择
app.get('/api/session/:id/selections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        sel.step_id,
        sel.option_id,
        so.name as option_name,
        so.model,
        so.material_code,
        sel.quantity,
        sel.is_auto_bound
      FROM session_selections sel
      JOIN step_options so ON sel.option_id = so.id
      WHERE sel.session_id = $1
      ORDER BY sel.id
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('获取会话选择失败:', error);
    res.status(500).json({ error: '获取会话选择失败' });
  }
});

// 健康检查
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
});

export default app;