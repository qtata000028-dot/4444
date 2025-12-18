export type Role = 'admin' | 'user' | 'planner' | 'viewer';

export interface Department {
  department_id: number;
  dep_name: string;
}

export interface FileObject {
  file_id?: string;
  owner_emp_id: string;
  file_kind: 'avatar';
  origin_name: string;
  mime_type: string;
  size_bytes: number;
  bucket: string;
  object_path: string;
  is_public: boolean;
  created_at?: string;
}

export interface EmployeeUser {
  emp_id: string;
  login_name: string;
  emp_name: string;
  department_id: number | null;
  pwd: string;
  role: Role;
  is_active: boolean;
  avatar_file_id?: string | null;
  remark?: string | null;
}

export interface EmployeeProfile extends EmployeeUser {
  department?: Department | null;
  avatar_file?: FileObject | null;
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

export interface SessionPayload {
  emp_id: string;
  login_name: string;
  emp_name: string;
  role: Role;
  department_id: number | null;
  login_time: string;
}
