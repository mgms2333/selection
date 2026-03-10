import { http } from './request';

export interface WorkstationType {
  id: number;
  name: string;
  code: string;
  description: string;
  icon?: string;
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
}

export interface StepOption {
  id: number;
  name: string;
  model: string;
  material_code: string;
  category_code: string;
  description: string;
  price: number;
  unit: string;
  is_filtered?: boolean;
  specifications?: Record<string, string>;
}

export interface SessionInfo {
  session_id: string;
  employee_id: string;
  employee_name: string;
  workstation_type_id: number;
  workstation_type_name: string;
  current_step: number;
  status: string;
}

export interface SelectionResult {
  session_id: string;
  employee_id: string;
  employee_name: string;
  workstation_type: string;
  selections: Array<{
    step_name: string;
    option: StepOption;
    is_auto_binding: boolean;
  }>;
  total_price: number;
}

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
      params: sessionId ? { session_id: sessionId } : {} 
    }),

  // 创建选型会话
  createSession: (data: { employee_id: string; employee_name: string; workstation_type_id: number }) => 
    http.post<{ session_id: string }>('/session', data),

  // 获取会话信息
  getSession: (sessionId: string) => 
    http.get<SessionInfo>(`/session/${sessionId}`),

  // 获取会话已选项
  getSessionSelections: (sessionId: string) => 
    http.get<Array<{ step_id: number; option_id: number }>>(`/session/${sessionId}/selections`),

  // 保存当前步骤选择
  saveSelection: (sessionId: string, data: { step_id: number; option_ids: number[] }) => 
    http.post<{ success: boolean; auto_bindings: StepOption[] }>(`/session/${sessionId}/select`, data),

  // 获取选型结果
  getResult: (sessionId: string) => 
    http.get<SelectionResult>(`/session/${sessionId}/result`),

  // 提交选型
  submitSession: (sessionId: string) => 
    http.post<{ success: boolean }>(`/session/${sessionId}/submit`),

  // 完成选型
  completeSession: (sessionId: string) => 
    http.post<{ success: boolean }>(`/session/${sessionId}/complete`),

  // 获取历史记录
  getHistory: (employeeId?: string) => 
    http.get<SelectionResult[]>('/history', { 
      params: employeeId ? { employee_id: employeeId } : {} 
    }),

  // 获取历史详情
  getHistoryDetail: (sessionId: string) => 
    http.get<SelectionResult>(`/history/${sessionId}`),
};