import { AppShell } from '../components/AppShell';

export function OrdersPage() {
  return (
    <AppShell title="订单管理" subtitle="准备好接入 Supabase 后，这里展示订单池与明细">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex h-full min-h-[260px] flex-col items-start justify-center rounded-2xl bg-white/85 p-6 shadow ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">订单池</h3>
          <p className="mt-3 max-w-md text-sm text-slate-600">当前已移除演示数据，接入 Supabase order_header 后即可在此拖拽调整 rank_no 并回写。</p>
        </div>
        <div className="flex h-full min-h-[260px] flex-col items-start justify-center rounded-2xl bg-white/85 p-6 shadow ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">图号明细</h3>
          <p className="mt-3 max-w-md text-sm text-slate-600">绑定 order_item 数据源后，将在此展示图号、数量及步骤模板选择。</p>
        </div>
      </div>
    </AppShell>
  );
}
