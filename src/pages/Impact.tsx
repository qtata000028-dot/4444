import { AppShell } from '../components/AppShell';

export function ImpactPage() {
  return (
    <AppShell title="影响分析" subtitle="接入排程数据后，对比不同方案的完工与缓冲">
      <div className="rounded-2xl bg-white/85 p-6 shadow ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">暂无分析数据</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">演示数据已移除。接通 Supabase 排程版本与预览结果后，可在此对比基线与当前方案的完工日期、缓冲天数及可行性变化。</p>
      </div>
    </AppShell>
  );
}
