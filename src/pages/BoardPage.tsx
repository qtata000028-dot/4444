import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { fetchRows, insertRows } from '../lib/supabaseClient';
import { getCurrentUser } from '../lib/auth';
import { OrderHeader, OrderItem, PlanAllocationDay, ProcessCalendarDay, StepTemplate } from '../types';
import { runSchedule, ScheduleOptions } from '../lib/scheduler';

interface HeatCell {
  process_id: string;
  work_date: string;
  used: number;
  avail: number;
}

export function BoardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [orders, setOrders] = useState<OrderHeader[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [steps, setSteps] = useState<StepTemplate[]>([]);
  const [calendar, setCalendar] = useState<ProcessCalendarDay[]>([]);
  const [locked, setLocked] = useState<PlanAllocationDay[]>([]);
  const [options, setOptions] = useState<ScheduleOptions>({ safetyDays: 2, allowSameDayHandoff: true });
  const [preview, setPreview] = useState<PlanAllocationDay[]>([]);
  const [previewSummary, setPreviewSummary] = useState<{ feasible: number; risky: number; infeasible: number }>({
    feasible: 0,
    risky: 0,
    infeasible: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRows, itemRows, stepRows, calendarRows, lockedRows] = await Promise.all([
        fetchRows<OrderHeader>('order_header'),
        fetchRows<OrderItem>('order_item'),
        fetchRows<StepTemplate>('step_template'),
        fetchRows<ProcessCalendarDay>('process_calendar_day'),
        fetchRows<PlanAllocationDay>('plan_allocation_day', { plan_id: 0 }),
      ]);
      setOrders(orderRows);
      setItems(itemRows);
      setSteps(stepRows);
      setCalendar(calendarRows);
      setLocked(lockedRows);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDrag = (dragOrder: string, targetRank: number) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.order_no === dragOrder ? { ...o, rank_no: targetRank } : o));
      return updated.sort((a, b) => a.rank_no - b.rank_no);
    });
  };

  const runPreview = () => {
    const result = runSchedule(orders, items, steps, calendar, locked, options);
    const feasible = result.previewResults.filter((r) => r.feasible).length;
    const infeasible = result.previewResults.filter((r) => !r.feasible).length;
    const risky = result.previewResults.length - feasible - infeasible;
    setPreview(result.allocations);
    localStorage.setItem('preview_allocations', JSON.stringify(result.allocations));
    setPreviewSummary({ feasible, risky, infeasible });
  };

  useEffect(() => {
    if (orders.length && items.length && steps.length) {
      runPreview();
    }
  }, [orders, items, steps, calendar, locked, options]);

  const heat: HeatCell[] = useMemo(() => {
    const map = new Map<string, HeatCell>();
    calendar.forEach((c) => {
      const key = `${c.process_id}-${c.work_date}`;
      map.set(key, { process_id: c.process_id, work_date: c.work_date, used: 0, avail: c.avail_hours });
    });
    preview.forEach((p) => {
      const key = `${p.process_id}-${p.work_date}`;
      const cell = map.get(key);
      if (cell) {
        cell.used += p.alloc_hours;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.work_date.localeCompare(b.work_date));
  }, [calendar, preview]);

  const submitPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const existing = await fetchRows<PlanAllocationDay>('plan_allocation_day', { plan_id: 1 }, 'plan_id');
      const maxPlan = existing.sort((a, b) => (a.plan_id || 0) - (b.plan_id || 0)).pop()?.plan_id || 0;
      const nextPlanId = maxPlan + 1;
      const payload = preview.map((p) => ({ ...p, plan_id: nextPlanId, plan_time: new Date().toISOString(), source: 'auto' as const }));
      if (payload.length > 0) {
        await insertRows<PlanAllocationDay>('plan_allocation_day', payload);
      }
      navigate(`/impact?baseline=${nextPlanId}`);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        title="排程看板"
        actions={
          <div className="flex items-center gap-2 text-sm">
            <button
              className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-100"
              onClick={() => window.open('/steps', '_blank')}
            >
              打开【工艺步骤库】
            </button>
            <button className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-100" onClick={() => window.open('/orders', '_blank')}>
              打开【订单】
            </button>
            <button className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-100" onClick={() => window.open('/calendar', '_blank')}>
              打开【工序日历】
            </button>
            <button className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-100" onClick={() => window.open('/employees', '_blank')}>
              打开【员工】
            </button>
          </div>
        }
        showBack={false}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-10">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            title="排程参数"
            actions={
              <button
                className="rounded bg-primary px-3 py-1 text-sm font-semibold text-white shadow hover:bg-blue-600"
                onClick={runPreview}
                disabled={loading}
              >
                重新预览
              </button>
            }
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <label className="w-28 text-slate-700">安全缓冲天数</label>
                <input
                  type="number"
                  value={options.safetyDays}
                  min={0}
                  className="w-24 rounded border border-slate-200 px-2 py-1"
                  onChange={(e) => setOptions({ ...options, safetyDays: Number(e.target.value) })}
                />
                <span className="text-slate-500">结算日期前的硬截止</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-28 text-slate-700">同日衔接</label>
                <input
                  type="checkbox"
                  checked={options.allowSameDayHandoff}
                  onChange={(e) => setOptions({ ...options, allowSameDayHandoff: e.target.checked })}
                />
                <span className="text-slate-500">允许前后工序同日交接</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="badge-success">可行 {previewSummary.feasible}</div>
                <div className="badge-warning">风险 {previewSummary.risky}</div>
                <div className="badge-danger">不可行 {previewSummary.infeasible}</div>
              </div>
            </div>
          </Card>

          <Card title="订单池排序（拖动调整）">
            <div className="space-y-2">
              {orders
                .sort((a, b) => a.rank_no - b.rank_no)
                .map((order, idx) => (
                  <div
                    key={order.order_no}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', order.order_no);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const dragged = e.dataTransfer.getData('text/plain');
                      handleDrag(dragged, idx + 1);
                    }}
                    className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">订单号：{order.order_no}</div>
                      <div className="text-xs text-slate-500">结算日期：{order.settle_date}</div>
                    </div>
                    <div className="text-xs text-slate-500">排序号：{order.rank_no}</div>
                  </div>
                ))}
            </div>
          </Card>

          <Card
            title="提交排程版本"
            actions={
              <button
                className="rounded bg-primary px-3 py-1 text-sm font-semibold text-white shadow hover:bg-blue-600"
                onClick={submitPlan}
                disabled={loading || !preview.length}
              >
                提交排程
              </button>
            }
          >
            <p className="text-sm text-slate-600">提交后生成新 plan_id，保存当前预览分配并跳转到影响分析。</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>· 自动使用最新预览结果</li>
              <li>· 数据写入 plan_allocation_day</li>
              <li>· plan_id 从 1 开始累加</li>
            </ul>
          </Card>
        </div>

        <Card title="工序产能热力">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>工序</th>
                  <th>日期</th>
                  <th>已用/可用小时</th>
                </tr>
              </thead>
              <tbody>
                {heat.map((cell) => {
                  const ratio = cell.avail === 0 ? 0 : Math.min(cell.used / cell.avail, 1);
                  const color = ratio > 0.9 ? 'text-red-600' : ratio > 0.6 ? 'text-yellow-600' : 'text-green-600';
                  return (
                    <tr key={`${cell.process_id}-${cell.work_date}`}>
                      <td>{cell.process_id}</td>
                      <td>{cell.work_date}</td>
                      <td className={color}>
                        {cell.used.toFixed(2)} / {cell.avail.toFixed(2)} h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="预览分配（前 30 条）">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>图号</th>
                  <th>工序</th>
                  <th>顺序号</th>
                  <th>工作日</th>
                  <th>分配小时</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 30).map((p, idx) => (
                  <tr key={`${p.order_no}-${idx}`}>
                    <td>{p.order_no}</td>
                    <td>{p.part_no}</td>
                    <td>{p.process_id}</td>
                    <td>{p.op_seq}</td>
                    <td>{p.work_date}</td>
                    <td>{p.alloc_hours.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
