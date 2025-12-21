import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { supabase } from '../lib/supabase';
import { ProcessMaster, StepOperation, StepTemplate } from '../types';

interface StepFormState {
  step_id: string;
  step_name: string;
  version: string;
  is_active: boolean;
  remark?: string | null;
  ops_json: StepOperation[];
}

const defaultOp = (seq: number): StepOperation => ({ op_seq: seq, process_id: '', setup_min: 0, run_min_per_piece: 0 });

export function StepsPage() {
  const [steps, setSteps] = useState<StepTemplate[]>([]);
  const [processes, setProcesses] = useState<ProcessMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StepTemplate | null>(null);
  const [form, setForm] = useState<StepFormState>({
    step_id: '',
    step_name: '',
    version: 'v1',
    is_active: true,
    remark: '',
    ops_json: [defaultOp(10)],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      const [{ data: stepData, error: stepError }, { data: processData }] = await Promise.all([
        supabase.from('step_template').select('*').order('step_id'),
        supabase.from('process_master').select('*').order('process_id'),
      ]);

      if (stepError) setError(stepError.message);
      setSteps((stepData as StepTemplate[]) || []);
      setProcesses((processData as ProcessMaster[]) || []);
      setLoading(false);
    };

    void fetchData();
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        step_id: editing.step_id,
        step_name: editing.step_name,
        version: editing.version,
        is_active: editing.is_active,
        remark: editing.remark || '',
        ops_json: editing.ops_json.length ? editing.ops_json : [defaultOp(10)],
      });
    }
  }, [editing]);

  const handleOpChange = (index: number, key: keyof StepOperation, value: string | number) => {
    setForm((prev) => {
      const ops = [...prev.ops_json];
      ops[index] = { ...ops[index], [key]: value } as StepOperation;
      return { ...prev, ops_json: ops };
    });
  };

  const addOperation = () => {
    setForm((prev) => ({ ...prev, ops_json: [...prev.ops_json, defaultOp((prev.ops_json.at(-1)?.op_seq || 0) + 10)] }));
  };

  const removeOperation = (index: number) => {
    setForm((prev) => ({ ...prev, ops_json: prev.ops_json.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ step_id: '', step_name: '', version: 'v1', is_active: true, remark: '', ops_json: [defaultOp(10)] });
  };

  const saveStep = async () => {
    if (!form.step_id || !form.step_name) {
      setError('请填写步骤编号和名称');
      return;
    }
    if (!form.ops_json.length) {
      setError('至少添加一道工序');
      return;
    }
    setSaving(true);
    setError('');
    const payload: StepTemplate = {
      step_id: form.step_id,
      step_name: form.step_name,
      version: form.version,
      is_active: form.is_active,
      remark: form.remark,
      ops_json: form.ops_json,
    };

    const { error: upsertError } = await supabase.from('step_template').upsert(payload, { onConflict: 'step_id' });
    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSteps((prev) => {
      const existing = prev.find((s) => s.step_id === payload.step_id);
      if (existing) {
        return prev.map((s) => (s.step_id === payload.step_id ? payload : s));
      }
      return [...prev, payload];
    });
    setSaving(false);
    resetForm();
  };

  const processOptions = useMemo(() => processes.map((p) => p.process_id), [processes]);

  return (
    <AppShell title="工艺步骤库" subtitle="维护步骤模板与工序工时，直接写入 Supabase step_template.ops_json">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">步骤列表</h3>
              <p className="text-sm text-slate-500">点击行进入编辑，支持版本/启用状态维护</p>
            </div>
            <button
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow"
              onClick={resetForm}
            >
              新建步骤
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">步骤编号</th>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">版本</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                      加载中...
                    </td>
                  </tr>
                )}
                {!loading && steps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                      暂无步骤数据
                    </td>
                  </tr>
                )}
                {steps.map((step) => (
                  <tr
                    key={step.step_id}
                    className="cursor-pointer transition hover:bg-slate-50"
                    onClick={() => setEditing(step)}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{step.step_id}</td>
                    <td className="px-4 py-3 text-slate-700">{step.step_name}</td>
                    <td className="px-4 py-3 text-slate-600">{step.version}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          step.is_active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-slate-50 text-slate-500 ring-slate-200'
                        }`}
                      >
                        {step.is_active ? '启用' : '停用'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{editing ? '编辑步骤' : '新增步骤'}</h3>
              <p className="text-sm text-slate-500">配置准备时间与单件工时（分钟）</p>
            </div>
            {editing && (
              <button className="text-sm font-semibold text-slate-500 underline" onClick={resetForm}>
                清空
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-slate-600">步骤编号</span>
                <input
                  value={form.step_id}
                  onChange={(e) => setForm({ ...form, step_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="STEP-1001"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">步骤名称</span>
                <input
                  value={form.step_name}
                  onChange={(e) => setForm({ ...form, step_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="如：初加工"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-600">版本</span>
                <input
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="v1"
                />
              </label>
              <label className="flex items-center gap-2 pt-6 text-slate-600">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                启用
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-slate-600">备注</span>
              <textarea
                value={form.remark || ''}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={2}
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">工序列表</h4>
                  <p className="text-xs text-slate-500">配置准备时间与单件工时（分钟）</p>
                </div>
                <button
                  onClick={addOperation}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow"
                >
                  + 添加工序
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {form.ops_json.map((op, idx) => (
                  <div key={idx} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">顺序 {op.op_seq}</span>
                      <button className="text-slate-500 underline" onClick={() => removeOperation(idx)}>
                        删除
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <label className="space-y-1">
                        <span className="text-slate-600">工序编码</span>
                        <input
                          value={op.process_id}
                          list="processOptions"
                          onChange={(e) => handleOpChange(idx, 'process_id', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="如 CNC"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600">准备时间 (min)</span>
                        <input
                          type="number"
                          value={op.setup_min}
                          min={0}
                          onChange={(e) => handleOpChange(idx, 'setup_min', Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600">单件工时 (min/件)</span>
                        <input
                          type="number"
                          value={op.run_min_per_piece}
                          min={0}
                          onChange={(e) => handleOpChange(idx, 'run_min_per_piece', Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600">顺序号</span>
                        <input
                          type="number"
                          value={op.op_seq}
                          onChange={(e) => handleOpChange(idx, 'op_seq', Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <datalist id="processOptions">
                {processOptions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                onClick={resetForm}
              >
                重置
              </button>
              <button
                disabled={saving}
                onClick={() => void saveStep()}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? '保存中...' : editing ? '更新步骤' : '保存步骤'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
