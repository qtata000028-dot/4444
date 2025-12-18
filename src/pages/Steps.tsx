import { AppShell } from '../components/AppShell';

export function StepsPage() {
  return (
    <AppShell title="工艺步骤库" subtitle="接入 Supabase step_template 后在此编辑 ops_json">
      <div className="rounded-2xl bg-white/85 p-6 shadow ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">暂无步骤数据</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">演示数据已移除。连接 Supabase 表后，可在此展示 step_id、版本、启用状态，以及表格编辑工序顺序与工时。</p>
      </div>
    </AppShell>
  );
}
