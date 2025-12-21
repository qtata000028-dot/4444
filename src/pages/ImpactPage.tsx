import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { fetchRows } from '../lib/supabaseClient';
import { PlanAllocationDay } from '../types';

interface ImpactRow {
  order_no: string;
  part_no: string;
  finish_date: string;
  baseline_finish?: string;
  buffer_days?: number;
  change?: '可行' | '风险' | '不可行';
}

export function ImpactPage() {
  const [params] = useSearchParams();
  const baselineId = Number(params.get('baseline')) || 1;
  const [baseline, setBaseline] = useState<PlanAllocationDay[]>([]);
  const [current, setCurrent] = useState<PlanAllocationDay[]>([]);
  const [rows, setRows] = useState<ImpactRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const previewRaw = localStorage.getItem('preview_allocations');
    const preview = previewRaw ? (JSON.parse(previewRaw) as PlanAllocationDay[]) : [];
    setCurrent(preview);
    fetchRows<PlanAllocationDay>('plan_allocation_day', { plan_id: baselineId })
      .then(setBaseline)
      .catch((err) => setError(err.message));
  }, [baselineId]);

  useEffect(() => {
    const mapFinish = (allocs: PlanAllocationDay[]) => {
      const finishMap = new Map<string, string>();
      allocs.forEach((a) => {
        const key = `${a.order_no}-${a.part_no}`;
        const existing = finishMap.get(key);
        if (!existing || existing < a.work_date) {
          finishMap.set(key, a.work_date);
        }
      });
      return finishMap;
    };
    const baseFinish = mapFinish(baseline);
    const currentFinish = mapFinish(current);
    const mergedKeys = new Set([...Array.from(baseFinish.keys()), ...Array.from(currentFinish.keys())]);
    const mergedRows: ImpactRow[] = [];
    mergedKeys.forEach((key) => {
      const [order_no, part_no] = key.split('-');
      const baselineFinish = baseFinish.get(key);
      const nowFinish = currentFinish.get(key);
      if (!nowFinish) return;
      const bufferDays = baselineFinish ? Math.floor((new Date(baselineFinish).getTime() - new Date(nowFinish).getTime()) / (1000 * 3600 * 24)) : undefined;
      mergedRows.push({ order_no, part_no, finish_date: nowFinish, baseline_finish: baselineFinish, buffer_days: bufferDays, change: bufferDays && bufferDays < 0 ? '风险' : '可行' });
    });
    setRows(mergedRows);
  }, [baseline, current]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="影响分析" />
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Card title={`基线 plan_id = ${baselineId}`}>
          <p className="text-sm text-slate-600">对比当前预览与基线版本的完工日期与缓冲天数变化。</p>
        </Card>
        <Card title="变化明细">
          <table className="table-base">
            <thead>
              <tr>
                <th>订单号</th>
                <th>图号</th>
                <th>当前完工</th>
                <th>基线完工</th>
                <th>缓冲天数</th>
                <th>变化</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.order_no}-${r.part_no}`}>
                  <td>{r.order_no}</td>
                  <td>{r.part_no}</td>
                  <td>{r.finish_date}</td>
                  <td>{r.baseline_finish || '—'}</td>
                  <td>{r.buffer_days ?? '—'}</td>
                  <td>
                    <span className={r.change === '风险' ? 'badge-warning' : 'badge-success'}>{r.change}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
