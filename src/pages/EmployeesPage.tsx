import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { fetchRows, insertRows, updateRows } from '../lib/supabaseClient';
import { EmployeeUser } from '../types';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [editing, setEditing] = useState<Partial<EmployeeUser> | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await fetchRows<EmployeeUser>('employee_user');
      setEmployees(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.emp_id || !editing.login_name || !editing.emp_name) return;
    const payload: EmployeeUser = {
      emp_id: editing.emp_id,
      login_name: editing.login_name,
      emp_name: editing.emp_name,
      pwd: editing.pwd || '123456',
      role: (editing.role as EmployeeUser['role']) || 'viewer',
      is_active: editing.is_active ?? true,
      remark: editing.remark || null,
    };
    if (employees.find((e) => e.emp_id === payload.emp_id)) {
      await updateRows<EmployeeUser>('employee_user', { emp_id: payload.emp_id }, payload);
    } else {
      await insertRows<EmployeeUser>('employee_user', payload);
    }
    setEditing(null);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="员工模块" actions={<button onClick={() => setEditing({ emp_id: '', emp_name: '', login_name: '', is_active: true })}>新增员工</button>} />
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Card title="员工列表">
          <table className="table-base">
            <thead>
              <tr>
                <th>员工ID</th>
                <th>姓名</th>
                <th>登录名</th>
                <th>角色</th>
                <th>启用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.emp_id}>
                  <td>{e.emp_id}</td>
                  <td>{e.emp_name}</td>
                  <td>{e.login_name}</td>
                  <td>{e.role}</td>
                  <td>{e.is_active ? '是' : '否'}</td>
                  <td>
                    <button className="text-primary" onClick={() => setEditing(e)}>
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {editing && (
          <Card title="员工编辑">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-700">员工ID</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.emp_id || ''}
                  onChange={(e) => setEditing({ ...editing, emp_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">姓名</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.emp_name || ''}
                  onChange={(e) => setEditing({ ...editing, emp_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">登录名</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.login_name || ''}
                  onChange={(e) => setEditing({ ...editing, login_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">密码（明文演示）</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.pwd || ''}
                  onChange={(e) => setEditing({ ...editing, pwd: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">角色</label>
                <select
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.role || 'viewer'}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value as EmployeeUser['role'] })}
                >
                  <option value="admin">admin</option>
                  <option value="planner">planner</option>
                  <option value="viewer">viewer</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <span className="text-sm text-slate-700">是否启用</span>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-700">备注</label>
                <textarea
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.remark || ''}
                  onChange={(e) => setEditing({ ...editing, remark: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded bg-primary px-4 py-2 text-white" onClick={save}>
                保存
              </button>
              <button className="rounded border border-slate-200 px-4 py-2" onClick={() => setEditing(null)}>
                取消
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
