import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { mockOrders, mockItems, mockSteps, mockCalendar } from '../lib/mockData';
import { OrderHeader, PlanAllocationDay, SchedulePreviewResult } from '../types';
import { runSchedule, ScheduleOptions } from '../lib/scheduler';

interface HeatCell {
  process_id: string;
  work_date: string;
  used: number;
  avail: number;
}

export function BoardPage() {
  const [orders, setOrders] = useState<OrderHeader[]>(mockOrders);
  const [options, setOptions] = useState<ScheduleOptions>({ safetyDays: 2, allowSameDayHandoff: true });
  const [allocations, setAllocations] = useState<PlanAllocationDay[]>([]);
  const [preview, setPreview] = useState<SchedulePreviewResult[]>([]);

  useEffect(() => {
    const result = runSchedule(orders, mockItems, mockSteps, mockCalendar, [], options);
    setAllocations(result.allocations);
    setPreview(result.previewResults);
  }, [orders, options]);

  const heat = useMemo(() => {
    const map = new Map<string, HeatCell>();
    mockCalendar.forEach((c) => {
      map.set(`${c.process_id}-${c.work_date}`, { process_id: c.process_id, work_date: c.work_date, used: 0, avail: c.avail_hours });
    });
    allocations.forEach((a) => {
      const key = `${a.process_id}-${a.work_date}`;
      const cell = map.get(key);
      if (cell) cell.used += a.alloc_hours;
    });
    return Array.from(map.values()).sort((a, b) => a.work_date.localeCompare(b.work_date));
  }, [allocations]);

  return (
    <AppShell title="排程看板" subtitle="订单池拖动 + 产能热力 + 可行性概览">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">排程参数</h3>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">可行 {preview.filter((p) => p.feasible).length}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">风险 {preview.length - preview.filter((p) => p.feasible).length}</span>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center gap-3">
              <span className="w-28 text-slate-600">安全缓冲天数</span>
              <input
                type="number"
                className="w-24 rounded-lg border border-slate-200 px-3 py-2"
                value={options.safetyDays}
                min={0}
                onChange={(e) => setOptions({ ...options, safetyDays: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-28 text-slate-600">同日衔接</span>
              <input
                type="checkbox"
                checked={options.allowSameDayHandoff}
                onChange={(e) => setOptions({ ...options, allowSameDayHandoff: e.target.checked })}
              />
            </label>
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-200">
              订单按 rank_no 倒排产能，演示数据来自本地 mock，可替换为 Supabase 表。
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">订单池排序</h3>
            <p className="text-xs text-slate-500">拖动卡片调整 rank_no</p>
          </div>
          <div className="mt-4 space-y-3">
            {orders
              .sort((a, b) => a.rank_no - b.rank_no)
              .map((order, idx) => (
                <div
                  key={order.order_no}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', order.order_no)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const dragged = e.dataTransfer.getData('text/plain');
                    setOrders((prev) => {
                      const next = prev.map((o) =>
                        o.order_no === dragged ? { ...o, rank_no: idx + 1 } : o.rank_no >= idx + 1 ? { ...o, rank_no: o.rank_no + 1 } : o,
                      );
                      return next.sort((a1, b1) => a1.rank_no - b1.rank_no);
                    });
                  }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <div className="text-base font-semibold text-slate-900">{order.order_no}</div>
                    <div className="text-xs text-slate-500">结算日期：{order.settle_date}</div>
                  </div>
                  <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">排序 {order.rank_no}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">工序产能热力</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">工序</th>
                  <th className="pb-2">日期</th>
                  <th className="pb-2">已用 / 可用 (h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heat.map((cell) => {
                  const ratio = cell.avail === 0 ? 0 : cell.used / cell.avail;
                  const color = ratio > 0.9 ? 'text-red-600' : ratio > 0.6 ? 'text-amber-600' : 'text-emerald-600';
                  return (
                    <tr key={`${cell.process_id}-${cell.work_date}`} className="align-top">
                      <td className="py-2 font-semibold text-slate-800">{cell.process_id}</td>
                      <td className="py-2 text-slate-600">{cell.work_date}</td>
                      <td className={`py-2 ${color}`}>
                        {cell.used.toFixed(2)} / {cell.avail.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">预览结果</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {preview.map((p) => (
              <div key={`${p.order_no}-${p.part_no}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div>
                  <div className="font-semibold text-slate-900">{p.order_no} / {p.part_no}</div>
                  <div className="text-xs text-slate-500">完工日期：{p.finish_date || '—'}</div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    p.feasible ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  }`}
                >
                  {p.feasible ? '可行' : '不可行'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
