import { http } from './request';

// 类型定义
export interface WorkstationType {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
}

export interface SelectionStep {
  id: number;
  step_name: string;
  step_order: number;
  is_required: boolean;
  is_exclusive: boolean;
  is_multiple: boolean;
  min_selections: number;
  max_selections: number;
  category_name: string;
  category_code: string;
}

export interface StepOption {
  id: number;
  name: string;
  model: string;
  material_code: string;
  category_code: string;
  description: string;
  specifications: Record<string, any>;
  price: number;
  unit: string;
  is_filtered: boolean;
}

export interface SessionInfo {
  id: string;
  employee_id: string;
  employee_name: string;
  current_step: number;
  status: string;
  workstation_type_id: number;
  workstation_name: string;
  workstation_code: string;
}

export interface SelectionItem {
  step_id: number;
  step_name: string;
  step_order: number;
  option_id: number;
  option_name: string;
  model: string;
  material_code: string;
  category_code: string;
  description: string;
  specifications: Record<string, any>;
  price: number;
  unit: string;
  is_auto_bound: boolean;
  quantity: number;
}

export interface SelectionResult {
  selections: SelectionItem[];
  total_price: number;
}

export interface HistoryItem {
  session_id: string;
  employee_id: string;
  employee_name: string;
  workstation_name: string;
  created_at: string;
  status: string;
  item_count: number;
}

export interface HistoryDetail extends HistoryItem {
  selections: SelectionItem[];
  total_price: number;
  completed_at: string | null;
}

// API 方法
export const api = {
  // 获取工作站类型列表
  getWorkstationTypes: () => 
    http.get<WorkstationType[]>('/workstation-types'),

  // 获取指定工作站的选型步骤
  getWorkstationSteps: (workstationId: number) => 
    http.get<SelectionStep[]>(`/workstation/${workstationId}/steps`),

  // 获取指定步骤的选项
  getStepOptions: (stepId: number, sessionId?: string) => 
    http.get<StepOption[]>(`/steps/${stepId}/options`, {
      params: { session_id: sessionId }
    }),

  // 创建选型会话
  createSession: (data: { employee_id: string; employee_name: string; workstation_type_id: number }) => 
    http.post<{ session_id: string }>('/session', data),

  // 保存当前步骤选择
  saveSelection: (sessionId: string, data: { step_id: number; option_ids: number[] }) => 
    http.post<{ success: boolean; auto_bindings: any[] }>(`/session/${sessionId}/select`, data),

  // 获取选型结果
  getSessionResult: (sessionId: string) => 
    http.get<SelectionResult>(`/session/${sessionId}/result`),

  // 获取历史记录
  getHistory: (employeeId?: string) => 
    http.get<HistoryItem[]>('/history', {
      params: { employee_id: employeeId }
    }),

  // 获取历史详情
  getHistoryDetail: (sessionId: string) => 
    http.get<HistoryDetail>(`/history/${sessionId}`),

  // 完成选型
  completeSession: (sessionId: string) => 
    http.post<{ success: boolean }>(`/session/${sessionId}/complete`),

  // 删除选型记录
  deleteHistory: (sessionId: string) => 
    http.delete<{ success: boolean }>(`/history/${sessionId}`),

  // 获取会话信息
  getSession: (sessionId: string) => 
    http.get<SessionInfo>(`/session/${sessionId}`),

  // 获取会话选择
  getSessionSelections: (sessionId: string) => 
    http.get<any[]>(`/session/${sessionId}/selections`),
};

export default api;