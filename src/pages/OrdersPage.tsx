import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { fetchRows, insertRows, updateRows } from '../lib/supabaseClient';
import { OrderHeader, OrderItem, StepTemplate } from '../types';

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderHeader[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [steps, setSteps] = useState<StepTemplate[]>([]);
  const [editing, setEditing] = useState<Partial<OrderHeader> | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [orderRows, itemRows, stepRows] = await Promise.all([
        fetchRows<OrderHeader>('order_header'),
        fetchRows<OrderItem>('order_item'),
        fetchRows<StepTemplate>('step_template'),
      ]);
      setOrders(orderRows);
      setItems(itemRows);
      setSteps(stepRows);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveOrder = async () => {
    if (!editing?.order_no || !editing.settle_date) return;
    const payload: OrderHeader = {
      order_no: editing.order_no,
      rank_no: editing.rank_no || orders.length + 1,
      settle_date: editing.settle_date,
      release_date: editing.release_date || null,
      status: (editing.status as OrderHeader['status']) || '未排',
      note: editing.note || null,
    };
    if (orders.find((o) => o.order_no === payload.order_no)) {
      await updateRows<OrderHeader>('order_header', { order_no: payload.order_no }, payload);
    } else {
      await insertRows<OrderHeader>('order_header', payload);
    }
    setEditing(null);
    load();
  };

  const handleRankDrop = (orderNo: string, rank: number) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.order_no === orderNo ? { ...o, rank_no: rank } : o));
      return updated.sort((a, b) => a.rank_no - b.rank_no);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="订单模块" actions={<button onClick={() => setEditing({ order_no: '', settle_date: '', status: '未排', rank_no: orders.length + 1 })}>新增订单</button>} />
      <div className="mx-auto max-w-6xl space-y-4 px-4 pb-10">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Card title="订单列表">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>结算日期</th>
                  <th>排序号</th>
                  <th>状态</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .sort((a, b) => a.rank_no - b.rank_no)
                  .map((o, idx) => (
                    <tr
                      key={o.order_no}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', o.order_no)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const drag = e.dataTransfer.getData('text/plain');
                        handleRankDrop(drag, idx + 1);
                      }}
                    >
                      <td>{o.order_no}</td>
                      <td>{o.settle_date}</td>
                      <td>{o.rank_no}</td>
                      <td>{o.status}</td>
                      <td>{o.note}</td>
                      <td>
                        <button className="text-primary" onClick={() => setEditing(o)}>
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        {editing && (
          <Card title="订单编辑">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-700">订单号</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.order_no || ''}
                  onChange={(e) => setEditing({ ...editing, order_no: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">结算日期</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.settle_date || ''}
                  onChange={(e) => setEditing({ ...editing, settle_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">最早开工</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.release_date || ''}
                  onChange={(e) => setEditing({ ...editing, release_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-700">状态</label>
                <select
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.status || '未排'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as OrderHeader['status'] })}
                >
                  <option>未排</option>
                  <option>已排</option>
                  <option>生产中</option>
                  <option>完工</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-700">排序号</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.rank_no || 1}
                  onChange={(e) => setEditing({ ...editing, rank_no: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-700">备注</label>
                <textarea
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                  value={editing.note || ''}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded bg-primary px-4 py-2 text-white" onClick={saveOrder}>
                保存
              </button>
              <button className="rounded border border-slate-200 px-4 py-2" onClick={() => setEditing(null)}>
                取消
              </button>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">订单明细</h3>
              <OrderItemList
                items={items.filter((i) => i.order_no === editing.order_no)}
                steps={steps}
                onChange={(changed) => {
                  const others = items.filter((i) => i.order_no !== editing.order_no);
                  setItems([...others, ...changed]);
                }}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ItemProps {
  items: OrderItem[];
  steps: StepTemplate[];
  onChange: (items: OrderItem[]) => void;
}

function OrderItemList({ items, steps, onChange }: ItemProps) {
  const [draft, setDraft] = useState<OrderItem>({ order_no: '', part_no: '', qty: 1, step_id: steps[0]?.step_id || '' });

  const save = async () => {
    if (!draft.order_no || !draft.part_no) return;
    await insertRows<OrderItem>('order_item', draft);
    onChange([...items, draft]);
    setDraft({ ...draft, part_no: '' });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="rounded border border-slate-200 px-2 py-1"
          placeholder="订单号"
          value={draft.order_no}
          onChange={(e) => setDraft({ ...draft, order_no: e.target.value })}
        />
        <input
          className="rounded border border-slate-200 px-2 py-1"
          placeholder="图号"
          value={draft.part_no}
          onChange={(e) => setDraft({ ...draft, part_no: e.target.value })}
        />
        <input
          type="number"
          className="rounded border border-slate-200 px-2 py-1"
          placeholder="数量"
          value={draft.qty}
          onChange={(e) => setDraft({ ...draft, qty: Number(e.target.value) })}
        />
        <select
          className="rounded border border-slate-200 px-2 py-1"
          value={draft.step_id}
          onChange={(e) => setDraft({ ...draft, step_id: e.target.value })}
        >
          {steps.map((s) => (
            <option key={s.step_id} value={s.step_id}>
              {s.step_name}
            </option>
          ))}
        </select>
      </div>
      <button className="rounded border border-slate-200 px-3 py-1 text-sm" onClick={save}>
        新增图号行
      </button>
      <table className="table-base">
        <thead>
          <tr>
            <th>图号</th>
            <th>数量</th>
            <th>步骤</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.part_no}>
              <td>{i.part_no}</td>
              <td>{i.qty}</td>
              <td>{i.step_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
