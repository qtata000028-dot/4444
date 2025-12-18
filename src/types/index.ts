export interface EmployeeUser {
  emp_id: string;
  login_name: string;
  emp_name: string;
  pwd: string;
  role: 'admin' | 'planner' | 'viewer';
  is_active: boolean;
  remark?: string | null;
}

export interface ProcessMaster {
  process_id: string;
  process_name: string;
  is_active: boolean;
  remark?: string | null;
}

export interface ProcessCalendarDay {
  process_id: string;
  work_date: string;
  avail_hours: number;
  reason?: string | null;
}

export interface StepOperation {
  op_seq: number;
  process_id: string;
  setup_min: number;
  run_min_per_piece: number;
}

export interface StepTemplate {
  step_id: string;
  step_name: string;
  version: string;
  is_active: boolean;
  ops_json: StepOperation[];
  remark?: string | null;
}

export interface OrderHeader {
  order_no: string;
  rank_no: number;
  release_date?: string | null;
  settle_date: string;
  status: '未排' | '已排' | '生产中' | '完工';
  note?: string | null;
}

export interface OrderItem {
  order_no: string;
  part_no: string;
  qty: number;
  step_id: string;
  remark?: string | null;
}

export interface PlanAllocationDay {
  allocation_id?: number;
  plan_id: number;
  plan_time: string;
  work_date: string;
  process_id: string;
  order_no: string;
  part_no: string;
  op_seq: number;
  alloc_hours: number;
  source: 'manual' | 'auto';
  note?: string | null;
}

export interface SchedulePreviewResult {
  order_no: string;
  part_no: string;
  feasible: boolean;
  bottleneck?: string;
  finish_date?: string;
}
