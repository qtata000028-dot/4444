import { AppShell } from '../components/AppShell';
import { mockOrders, mockItems } from '../lib/mockData';

export function OrdersPage() {
  return (
    <AppShell title="订单管理" subtitle="演示订单池与明细，可替换为 Supabase CRUD">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">订单池</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {mockOrders.map((o) => (
              <div key={o.order_no} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold text-slate-900">{o.order_no}</div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">rank {o.rank_no}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span>结算日期：{o.settle_date}</span>
                  <span>最早开工：{o.release_date}</span>
                  <span>状态：{o.status}</span>
                  <span>备注：{o.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">图号明细</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">订单号</th>
                  <th className="pb-2">图号</th>
                  <th className="pb-2">数量</th>
                  <th className="pb-2">步骤模板</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockItems.map((item) => (
                  <tr key={`${item.order_no}-${item.part_no}`} className="align-top">
                    <td className="py-2 font-semibold text-slate-800">{item.order_no}</td>
                    <td className="py-2 text-slate-700">{item.part_no}</td>
                    <td className="py-2 text-slate-700">{item.qty}</td>
                    <td className="py-2 text-slate-600">{item.step_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">提示：在接入 Supabase 后，可用拖拽更新 rank_no 并写回 order_header。</p>
        </div>
      </div>
    </AppShell>
  );
}
