import { AppShell } from '../components/AppShell';

const rows = [
  { name: 'department', fields: 'department_id (pk), dep_name', note: '部门主数据' },
  { name: 'employee_user', fields: 'emp_id (pk), login_name, emp_name, department_id, pwd, role, is_active, avatar_file_id', note: '自定义登录体系' },
  { name: 'file_object', fields: 'file_id (pk), owner_emp_id, file_kind, origin_name, mime_type, size_bytes, bucket, object_path, is_public', note: '文件元数据 / 头像' },
  { name: 'process_master', fields: 'process_id, process_name, is_active, remark', note: '工序主数据' },
  { name: 'process_calendar_day', fields: 'process_id, work_date, avail_hours, reason', note: '工序日历产能' },
  { name: 'step_template', fields: 'step_id, step_name, version, is_active, ops_json, remark', note: '工艺步骤模板' },
  { name: 'order_header', fields: 'order_no, rank_no, release_date, settle_date, status, note', note: '订单池' },
  { name: 'order_item', fields: 'order_no, part_no, qty, step_id, remark', note: '订单图号行' },
  { name: 'plan_allocation_day', fields: 'allocation_id, plan_id, plan_time, work_date, process_id, order_no, part_no, op_seq, alloc_hours, source, note', note: '排程分配' },
];

export function TablesPage() {
  return (
    <AppShell title="数据表字典" subtitle="对照 Supabase 表，便于 CRUD 接入">
      <div className="overflow-x-auto rounded-2xl bg-white/80 shadow ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-5 py-3">表名</th>
              <th className="px-5 py-3">字段</th>
              <th className="px-5 py-3">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.name} className="align-top">
                <td className="px-5 py-3 font-semibold text-slate-800">{row.name}</td>
                <td className="px-5 py-3 text-slate-700">{row.fields}</td>
                <td className="px-5 py-3 text-slate-600">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
