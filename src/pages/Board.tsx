import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { OrderHeader, OrderItem, PlanAllocationDay, ProcessCalendarDay, SchedulePreviewResult, SessionPayload, StepTemplate } from '../types';
import { runSchedule, ScheduleOptions } from '../lib/scheduler';
import { getSession, saveSession } from '../lib/auth';
import { getPublicFileUrl, supabase } from '../lib/supabase';
import { Camera, Loader2, BadgeCheck, Building2 } from 'lucide-react';

interface HeatCell {
  process_id: string;
  work_date: string;
  used: number;
  avail: number;
}

export function BoardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionPayload | null>(() => getSession());
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [orders, setOrders] = useState<OrderHeader[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [steps, setSteps] = useState<StepTemplate[]>([]);
  const [calendar, setCalendar] = useState<ProcessCalendarDay[]>([]);
  const [options, setOptions] = useState<ScheduleOptions>({ safetyDays: 2, allowSameDayHandoff: true });
  const [allocations, setAllocations] = useState<PlanAllocationDay[]>([]);
  const [preview, setPreview] = useState<SchedulePreviewResult[]>([]);

  useEffect(() => {
    if (session?.avatar_path) {
      setAvatarUrl(getPublicFileUrl('avatars', session.avatar_path));
    }
  }, [session]);

  useEffect(() => {
    const result = runSchedule(orders, items, steps, calendar, [], options);
    setAllocations(result.allocations);
    setPreview(result.previewResults);
  }, [orders, items, steps, calendar, options]);

  const handleAvatar = async (file: File) => {
    if (!session) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('仅支持 jpg/png/webp');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('文件大小限制 2MB');
      return;
    }
    setUploading(true);
    setAvatarError('');
    const ext = file.name.split('.').pop() || 'png';
    const object_path = `${session.emp_id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(object_path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) {
      setAvatarError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('employee_user')
      .update({ avatar_path: object_path })
      .eq('emp_id', session.emp_id);
    if (updateError) {
      setAvatarError(updateError.message);
      setUploading(false);
      return;
    }

    const updatedSession = { ...session, avatar_path: object_path };
    saveSession(updatedSession);
    setSession(updatedSession);
    setAvatarUrl(getPublicFileUrl('avatars', object_path));
    setUploading(false);
  };

  const heat = useMemo(() => {
    const map = new Map<string, HeatCell>();
    calendar.forEach((c) => {
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
      {session && (
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] ring-1 ring-slate-800/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,0.25),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(52,211,153,0.18),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(129,140,248,0.18),transparent_30%)] opacity-70" />
          <div className="pointer-events-none absolute inset-y-0 right-10 h-64 w-64 rotate-12 rounded-full bg-white/5 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5 md:flex-row md:items-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl shadow-emerald-500/20">
              {avatarUrl ? (
                <img src={avatarUrl} className="h-full w-full rounded-3xl object-cover" alt="avatar" />
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl text-sm text-slate-200">未上传</div>
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-slate-950/60 opacity-0 backdrop-blur-sm transition hover:opacity-100">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatar(file);
                  }}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-200">个人卡片</p>
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-white drop-shadow-sm">{session.emp_name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold shadow-sm ring-1 ring-white/15">
                  <Building2 className="h-4 w-4" />
                  <span>{session.department_id || '未分配部门'}</span>
                  <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-900 shadow-sm">请假</span>
                </span>
                <span className="rounded-full bg-emerald-100/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-200/40 shadow-sm">角色：{session.role || '—'}</span>
              </div>
            </div>
          </div>
          {avatarError && <div className="relative mt-4 rounded-xl bg-red-50/90 p-3 text-sm text-red-700 ring-1 ring-red-200">{avatarError}</div>}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 backdrop-blur">
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
              <p className="rounded-xl bg-slate-50/90 p-3 text-xs text-slate-500 ring-1 ring-slate-200">接入 Supabase 订单/日历后将即时刷新排程预览。</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">功能区</h3>
              <p className="text-xs text-slate-500">点击卡片切换上方页签</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: '订单管理', desc: '维护订单与零件明细', to: '/orders' },
                { label: '工艺步骤', desc: '配置工序模板', to: '/steps' },
                { label: '影响分析', desc: '对比排程结果', to: '/impact' },
                { label: '数据字典', desc: '查看表结构字段', to: '/tables' },
              ].map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.desc}</span>
                  <span className="text-[11px] font-semibold text-blue-600">打开模块 →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">订单池排序</h3>
              <p className="text-xs text-slate-500">拖动卡片调整 rank_no（暂无数据时保持空状态）</p>
            </div>
            <div className="mt-4 space-y-3">
              {orders.length === 0 && <p className="text-sm text-slate-500">暂无订单数据，接通 Supabase 后可在此拖动排序。</p>}
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
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow"
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
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-900">工序产能热力</h3>
          {heat.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">等待产能数据接入后展示热力列表。</p>
          ) : (
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
          )}
        </div>

        <div className="rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-900">预览结果</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {preview.length === 0 && <p className="text-sm text-slate-500">暂无预览结果，请接入 Supabase 数据源后自动刷新。</p>}
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
