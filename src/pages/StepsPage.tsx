import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { fetchRows, insertRows, updateRows } from '../lib/supabaseClient';
import { ProcessMaster, StepOperation, StepTemplate } from '../types';

export function StepsPage() {
  const [steps, setSteps] = useState<StepTemplate[]>([]);
  const [processes, setProcesses] = useState<ProcessMaster[]>([]);
  const [editing, setEditing] = useState<Partial<StepTemplate> | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [stepRows, processRows] = await Promise.all([
        fetchRows<StepTemplate>('step_template'),
        fetchRows<ProcessMaster>('process_master'),
      ]);
      setSteps(stepRows);
      setProcesses(processRows);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const defaultOp: StepOperation = { op_seq: 10, process_id: processes[0]?.process_id || '', setup_min: 30, run_min_per_piece: 5 };

  const handleSave = async () => {
    if (!editing?.step_id || !editing.step_name) return;
    const payload: StepTemplate = {
      step_id: editing.step_id,
      step_name: editing.step_name,
      version: editing.version || 'v1',
      is_active: editing.is_active ?? true,
      ops_json: editing.ops_json || [defaultOp],
      remark: editing.remark || null,
    };
    if (steps.find((s) => s.step_id === payload.step_id)) {
      await updateRows<StepTemplate>('step_template', { step_id: payload.step_id }, payload);
    } else {
      await insertRows<StepTemplate>('step_template', payload);
    }
    setEditing(null);
    load();
  };

  const addOperation = () => {
    setEditing((prev) => ({
      ...(prev || { step_id: '', step_name: '', ops_json: [] }),
      ops_json: [...(prev?.ops_json || []), { ...defaultOp, op_seq: (prev?.ops_json?.length || 0) * 10 + 10 }],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="工艺步骤库" actions={<button onClick={() => setEditing({ step_id: '', step_name: '', ops_json: [defaultOp], is_active: true })}>新增模板</button>} />
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Card title="模板列表">
          <table className="table-base">
            <thead>
              <tr>
                <th>步骤ID</th>
                <th>步骤名称</th>
                <th>版本</th>
                <th>是否启用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.step_id}>
                  <td>{s.step_id}</td>
                  <td>{s.step_name}</td>
                  <td>{s.version}</td>
                  <td>{s.is_active ? '是' : '否'}</td>
                  <td>
                    <button className="text-primary" onClick={() => setEditing(s)}>
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {editing && (
          <Card title="模板编辑">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-700">步骤ID</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.step_id || ''}
                  onChange={(e) => setEditing({ ...editing, step_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">步骤名称</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.step_name || ''}
                  onChange={(e) => setEditing({ ...editing, step_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">版本</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.version || ''}
                  onChange={(e) => setEditing({ ...editing, version: e.target.value })}
                />
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
                <label className="text-sm font-semibold text-slate-700">工序列表</label>
                <div className="mt-2 space-y-3">
                  {(editing.ops_json || []).map((op, idx) => (
                    <div key={idx} className="rounded border border-slate-200 p-3">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div>
                          <label className="text-xs text-slate-600">顺序号</label>
                          <input
                            type="number"
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={op.op_seq}
                            onChange={(e) => {
                              const ops = [...(editing.ops_json || [])];
                              ops[idx] = { ...op, op_seq: Number(e.target.value) };
                              setEditing({ ...editing, ops_json: ops });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">工序</label>
                          <select
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={op.process_id}
                            onChange={(e) => {
                              const ops = [...(editing.ops_json || [])];
                              ops[idx] = { ...op, process_id: e.target.value };
                              setEditing({ ...editing, ops_json: ops });
                            }}
                          >
                            {processes.map((p) => (
                              <option key={p.process_id} value={p.process_id}>
                                {p.process_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">准备时间(min)</label>
                          <input
                            type="number"
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={op.setup_min}
                            onChange={(e) => {
                              const ops = [...(editing.ops_json || [])];
                              ops[idx] = { ...op, setup_min: Number(e.target.value) };
                              setEditing({ ...editing, ops_json: ops });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">单件时间(min)</label>
                          <input
                            type="number"
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={op.run_min_per_piece}
                            onChange={(e) => {
                              const ops = [...(editing.ops_json || [])];
                              ops[idx] = { ...op, run_min_per_piece: Number(e.target.value) };
                              setEditing({ ...editing, ops_json: ops });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="rounded border border-slate-200 px-3 py-1 text-sm" onClick={addOperation}>
                    新增工序行
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded bg-primary px-4 py-2 text-white" onClick={handleSave}>
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
