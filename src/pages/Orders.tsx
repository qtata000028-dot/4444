import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { supabase } from '../lib/supabase';
import { OrderHeader, OrderItem, StepTemplate } from '../types';

interface OrderFormState {
  order_no: string;
  settle_date: string;
  release_date?: string;
  status: OrderHeader['status'];
  note?: string;
  rank_no: number;
}

interface ItemFormState {
  part_no: string;
  qty: number;
  step_id: string;
  remark?: string;
}

const defaultOrderForm: OrderFormState = {
  order_no: '',
  settle_date: '',
  release_date: '',
  status: '未排',
  note: '',
  rank_no: 1,
};

const defaultItemForm: ItemFormState = { part_no: '', qty: 1, step_id: '', remark: '' };

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderHeader[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [steps, setSteps] = useState<StepTemplate[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [orderForm, setOrderForm] = useState<OrderFormState>(defaultOrderForm);
  const [itemForm, setItemForm] = useState<ItemFormState>(defaultItemForm);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const [{ data: orderData, error: orderError }, { data: itemData, error: itemError }, { data: stepData }] =
        await Promise.all([
          supabase.from('order_header').select('*').order('rank_no'),
          supabase.from('order_item').select('*'),
          supabase.from('step_template').select('*').order('step_id'),
        ]);
      if (orderError) setError(orderError.message);
      if (itemError && !error) setError(itemError.message);
      setOrders((orderData as OrderHeader[]) || []);
      setItems((itemData as OrderItem[]) || []);
      setSteps((stepData as StepTemplate[]) || []);
      setLoading(false);
    };

    void load();
  }, []);

  useEffect(() => {
    if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0].order_no);
    }
  }, [orders, selectedOrder]);

  const currentItems = useMemo(() => items.filter((i) => i.order_no === selectedOrder), [items, selectedOrder]);

  const saveOrder = async () => {
    if (!orderForm.order_no || !orderForm.settle_date) {
      setError('请填写订单号与结算日期');
      return;
    }
    setSavingOrder(true);
    setError('');
    const payload: OrderHeader = { ...orderForm };
    const { error: upsertError } = await supabase.from('order_header').upsert(payload, { onConflict: 'order_no' });
    if (upsertError) {
      setError(upsertError.message);
      setSavingOrder(false);
      return;
    }
    setOrders((prev) => {
      const exists = prev.find((o) => o.order_no === payload.order_no);
      if (exists) return prev.map((o) => (o.order_no === payload.order_no ? payload : o));
      return [...prev, payload].sort((a, b) => a.rank_no - b.rank_no);
    });
    setSelectedOrder(payload.order_no);
    setOrderForm(defaultOrderForm);
    setSavingOrder(false);
  };

  const saveItem = async () => {
    if (!selectedOrder) {
      setError('请先选择或创建订单');
      return;
    }
    if (!itemForm.part_no || !itemForm.qty || !itemForm.step_id) {
      setError('请完整填写图号、数量与步骤');
      return;
    }
    setSavingItem(true);
    setError('');
    const payload: OrderItem = { ...itemForm, order_no: selectedOrder };
    const { error: insertError } = await supabase.from('order_item').upsert(payload, { onConflict: 'order_no,part_no' });
    if (insertError) {
      setError(insertError.message);
      setSavingItem(false);
      return;
    }
    setItems((prev) => {
      const exists = prev.find((i) => i.order_no === payload.order_no && i.part_no === payload.part_no);
      if (exists) return prev.map((i) => (i.order_no === payload.order_no && i.part_no === payload.part_no ? payload : i));
      return [...prev, payload];
    });
    setItemForm(defaultItemForm);
    setSavingItem(false);
  };

  return (
    <AppShell title="订单管理" subtitle="维护订单、图号数量与步骤绑定，写入 Supabase order_header 与 order_item">
      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-2xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">订单池</h3>
              <p className="text-sm text-slate-500">录入订单号、交期、状态及优先级 rank_no</p>
            </div>
            <span className="text-xs text-slate-500">共 {orders.length} 条</span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <h4 className="text-sm font-semibold text-slate-900">新建/编辑订单</h4>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                <label className="space-y-1">
                  <span className="text-slate-600">订单号</span>
                  <input
                    value={orderForm.order_no}
                    onChange={(e) => setOrderForm({ ...orderForm, order_no: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="ORD-001"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">排序 rank_no</span>
                  <input
                    type="number"
                    min={1}
                    value={orderForm.rank_no}
                    onChange={(e) => setOrderForm({ ...orderForm, rank_no: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">结算日期</span>
                  <input
                    type="date"
                    value={orderForm.settle_date}
                    onChange={(e) => setOrderForm({ ...orderForm, settle_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">最早开工</span>
                  <input
                    type="date"
                    value={orderForm.release_date}
                    onChange={(e) => setOrderForm({ ...orderForm, release_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">状态</span>
                  <select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as OrderHeader['status'] })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="未排">未排</option>
                    <option value="已排">已排</option>
                    <option value="生产中">生产中</option>
                    <option value="完工">完工</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">备注</span>
                  <input
                    value={orderForm.note}
                    onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end gap-3 text-sm">
                <button
                  className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
                  onClick={() => setOrderForm(defaultOrderForm)}
                >
                  重置
                </button>
                <button
                  disabled={savingOrder}
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 font-semibold text-white shadow disabled:opacity-70"
                  onClick={() => void saveOrder()}
                >
                  {savingOrder ? '保存中...' : '保存订单'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">订单列表</h4>
              <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1 text-sm">
                {loading && <p className="text-slate-500">加载中...</p>}
                {!loading && orders.length === 0 && <p className="text-slate-500">暂无订单</p>}
                {orders.map((order) => (
                  <button
                    key={order.order_no}
                    onClick={() => setSelectedOrder(order.order_no)}
                    className={`flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow ${
                      selectedOrder === order.order_no
                        ? 'border-slate-900 bg-slate-900 text-white shadow'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-semibold">{order.order_no}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">排序 {order.rank_no}</span>
                    </div>
                    <div className="mt-1 text-xs opacity-80">交期 {order.settle_date}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest opacity-60">{order.status}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">图号明细</h3>
              <p className="text-sm text-slate-500">为当前订单添加零件、数量与步骤</p>
            </div>
            {selectedOrder && <span className="text-xs text-slate-500">当前订单：{selectedOrder}</span>}
          </div>

          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <h4 className="text-sm font-semibold text-slate-900">新增零件</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-slate-600">图号</span>
                  <input
                    value={itemForm.part_no}
                    onChange={(e) => setItemForm({ ...itemForm, part_no: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="PART-01"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">投产数量</span>
                  <input
                    type="number"
                    min={1}
                    value={itemForm.qty}
                    onChange={(e) => setItemForm({ ...itemForm, qty: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">选择步骤模板</span>
                  <select
                    value={itemForm.step_id}
                    onChange={(e) => setItemForm({ ...itemForm, step_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">请选择</option>
                    {steps.map((step) => (
                      <option key={step.step_id} value={step.step_id}>
                        {step.step_name} ({step.step_id})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-slate-600">备注</span>
                  <input
                    value={itemForm.remark}
                    onChange={(e) => setItemForm({ ...itemForm, remark: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end gap-3">
                <button
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                  onClick={() => setItemForm(defaultItemForm)}
                >
                  重置
                </button>
                <button
                  disabled={savingItem}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-70"
                  onClick={() => void saveItem()}
                >
                  {savingItem ? '保存中...' : '保存零件'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">已添加零件</h4>
              <div className="mt-3 space-y-2">
                {!selectedOrder && <p className="text-slate-500">请先选择订单</p>}
                {selectedOrder && currentItems.length === 0 && <p className="text-slate-500">该订单暂无零件</p>}
                {currentItems.map((item) => (
                  <div
                    key={item.part_no}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.part_no}</div>
                      <div className="text-xs text-slate-500">数量 {item.qty} · 步骤 {item.step_id}</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      图号
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}
        </div>
      </div>
    </AppShell>
  );
}
