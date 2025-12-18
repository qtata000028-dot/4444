import { AppShell } from '../components/AppShell';
import { mockSteps } from '../lib/mockData';

export function StepsPage() {
  return (
    <AppShell title="工艺步骤库" subtitle="演示 ops_json 结构，支持工序配置">
      <div className="space-y-4">
        {mockSteps.map((step) => (
          <div key={step.step_id} className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{step.step_name}</h3>
                <p className="text-sm text-slate-500">版本：{step.version} · 状态：{step.is_active ? '启用' : '停用'}</p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{step.step_id}</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2">顺序</th>
                    <th className="pb-2">工序</th>
                    <th className="pb-2">准备时间 (min)</th>
                    <th className="pb-2">单件时间 (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {step.ops_json.map((op) => (
                    <tr key={op.op_seq} className="align-top">
                      <td className="py-2 font-semibold text-slate-800">{op.op_seq}</td>
                      <td className="py-2 text-slate-700">{op.process_id}</td>
                      <td className="py-2 text-slate-700">{op.setup_min}</td>
                      <td className="py-2 text-slate-700">{op.run_min_per_piece}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">保存时可写回 step_template.ops_json，演示版使用本地 mock。</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
