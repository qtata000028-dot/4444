import { AppShell } from '../components/AppShell';
import { mockOrders, mockItems, mockSteps, mockCalendar } from '../lib/mockData';
import { runSchedule } from '../lib/scheduler';

export function ImpactPage() {
  const baseline = runSchedule(mockOrders, mockItems, mockSteps, mockCalendar, [], { safetyDays: 2, allowSameDayHandoff: true });
  const alternative = runSchedule(mockOrders, mockItems, mockSteps, mockCalendar, [], { safetyDays: 3, allowSameDayHandoff: false });

  return (
    <AppShell title="影响分析" subtitle="对比不同排程参数下的完工变化">
      <div className="space-y-4">
        {baseline.previewResults.map((b) => {
          const alt = alternative.previewResults.find((p) => p.order_no === b.order_no && p.part_no === b.part_no);
          return (
            <div key={`${b.order_no}-${b.part_no}`} className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{b.order_no} / {b.part_no}</h3>
                  <p className="text-sm text-slate-500">基线完工：{b.finish_date || '—'} · 新方案：{alt?.finish_date || '—'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${b.feasible ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                  {b.feasible ? '基线可行' : '基线不可行'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700 md:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">基线缓冲：{b.finish_date ? '2 天安全期内' : '无'}</div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">新方案缓冲：{alt?.finish_date ? '更保守' : '—'}</div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">基线可行性：{b.feasible ? '可行' : '风险'}</div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">新方案可行性：{alt?.feasible ? '可行' : '风险'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
