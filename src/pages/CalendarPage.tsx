import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { fetchRows, insertRows, updateRows } from '../lib/supabaseClient';
import { ProcessCalendarDay, ProcessMaster } from '../types';

export function CalendarPage() {
  const [processes, setProcesses] = useState<ProcessMaster[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [range, setRange] = useState({ start: '', end: '' });
  const [days, setDays] = useState<ProcessCalendarDay[]>([]);
  const [defaultHours, setDefaultHours] = useState(8);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const proc = await fetchRows<ProcessMaster>('process_master');
      setProcesses(proc);
      setSelected(proc[0]?.process_id || '');
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selected) {
      fetchRows<ProcessCalendarDay>('process_calendar_day', { process_id: selected }).then(setDays).catch((err) => setError(err.message));
    }
  }, [selected]);

  const update = async (day: ProcessCalendarDay) => {
    await updateRows<ProcessCalendarDay>(
      'process_calendar_day',
      { process_id: day.process_id, work_date: day.work_date },
      { avail_hours: day.avail_hours, reason: day.reason || null },
    );
    setDays((prev) => prev.map((d) => (d.work_date === day.work_date ? day : d)));
  };

  const bulkGenerate = async () => {
    if (!range.start || !range.end || !selected) return;
    const start = new Date(range.start);
    const end = new Date(range.end);
    const payload: ProcessCalendarDay[] = [];
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      payload.push({ process_id: selected, work_date: d.toISOString().slice(0, 10), avail_hours: defaultHours, reason: '批量生成' });
    }
    await insertRows<ProcessCalendarDay>('process_calendar_day', payload);
    setDays([...days, ...payload]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="工序日历" />
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Card title="选择工序">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select
              className="rounded border border-slate-200 px-3 py-2"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {processes.map((p) => (
                <option key={p.process_id} value={p.process_id}>
                  {p.process_name}
                </option>
              ))}
            </select>
            <label className="text-slate-700">起止日期</label>
            <input type="date" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
            <span>-</span>
            <input type="date" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
            <input
              type="number"
              className="w-20 rounded border border-slate-200 px-2 py-1"
              value={defaultHours}
              onChange={(e) => setDefaultHours(Number(e.target.value))}
            />
            <span className="text-slate-500">小时/天</span>
            <button className="rounded bg-primary px-3 py-1 text-sm text-white" onClick={bulkGenerate}>
              批量生成
            </button>
          </div>
        </Card>

        <Card title="日历产能">
          <table className="table-base">
            <thead>
              <tr>
                <th>日期</th>
                <th>当日可用工时</th>
                <th>原因</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {days
                .sort((a, b) => a.work_date.localeCompare(b.work_date))
                .map((d) => (
                  <tr key={d.work_date}>
                    <td>{d.work_date}</td>
                    <td>
                      <input
                        type="number"
                        className="w-24 rounded border border-slate-200 px-2 py-1"
                        value={d.avail_hours}
                        onChange={(e) => setDays((prev) => prev.map((row) => (row.work_date === d.work_date ? { ...row, avail_hours: Number(e.target.value) } : row)))}
                      />
                    </td>
                    <td>
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1"
                        value={d.reason || ''}
                        onChange={(e) => setDays((prev) => prev.map((row) => (row.work_date === d.work_date ? { ...row, reason: e.target.value } : row)))}
                      />
                    </td>
                    <td>
                      <button className="text-primary" onClick={() => update(d)}>
                        保存
                      </button>
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
