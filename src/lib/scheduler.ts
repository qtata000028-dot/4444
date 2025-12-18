import { OrderHeader, OrderItem, PlanAllocationDay, ProcessCalendarDay, StepOperation, StepTemplate } from '../types';

export interface ScheduleOptions {
  safetyDays: number;
  allowSameDayHandoff: boolean;
}

interface CalendarMap {
  [process_id: string]: Record<string, number>;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

function ensureCalendar(calendar: ProcessCalendarDay[]): CalendarMap {
  const map: CalendarMap = {};
  calendar.forEach((c) => {
    map[c.process_id] = map[c.process_id] || {};
    map[c.process_id][c.work_date] = c.avail_hours;
  });
  return map;
}

function getOperationHours(op: StepOperation, qty: number) {
  return (op.setup_min + op.run_min_per_piece * qty) / 60;
}

export function runSchedule(
  orders: OrderHeader[],
  items: OrderItem[],
  steps: StepTemplate[],
  calendar: ProcessCalendarDay[],
  locked: PlanAllocationDay[],
  options: ScheduleOptions,
) {
  const stepMap = new Map(steps.map((s) => [s.step_id, s]));
  const orderItems = new Map<string, OrderItem[]>(
    items.reduce((acc, item) => {
      const existing = acc.find(([key]) => key === item.order_no);
      if (existing) {
        existing[1].push(item);
      } else {
        acc.push([item.order_no, [item]]);
      }
      return acc;
    }, [] as [string, OrderItem[]][]),
  );
  const calendarMap = ensureCalendar(calendar);
  const usedMap: CalendarMap = {};

  locked.forEach((l) => {
    usedMap[l.process_id] = usedMap[l.process_id] || {};
    usedMap[l.process_id][l.work_date] = (usedMap[l.process_id][l.work_date] || 0) + l.alloc_hours;
  });

  const allocations: PlanAllocationDay[] = [];
  const previewResults: { order_no: string; part_no: string; feasible: boolean; bottleneck?: string; finish_date?: string }[] = [];

  const sortedOrders = [...orders].sort((a, b) => a.rank_no - b.rank_no);

  sortedOrders.forEach((order) => {
    const relatedItems = orderItems.get(order.order_no) || [];
    relatedItems.forEach((item) => {
      const step = stepMap.get(item.step_id);
      if (!step) {
        previewResults.push({ order_no: order.order_no, part_no: item.part_no, feasible: false, bottleneck: '缺少步骤模板' });
        return;
      }
      const ops = [...step.ops_json].sort((a, b) => a.op_seq - b.op_seq);
      let latestDate = addDays(order.settle_date, -options.safetyDays);
      let feasible = true;
      const itemAllocations: PlanAllocationDay[] = [];

      for (let i = ops.length - 1; i >= 0; i -= 1) {
        const op = ops[i];
        const needHours = getOperationHours(op, item.qty);
        let remaining = needHours;
        let cursor = latestDate;
        let earliestUsed: string | null = null;

        while (remaining > 0) {
          const free = (calendarMap[op.process_id]?.[cursor] || 0) - (usedMap[op.process_id]?.[cursor] || 0);
          if (free > 0) {
            const alloc = Math.min(free, remaining);
            usedMap[op.process_id] = usedMap[op.process_id] || {};
            usedMap[op.process_id][cursor] = (usedMap[op.process_id][cursor] || 0) + alloc;
            remaining -= alloc;
            earliestUsed = cursor;
            itemAllocations.push({
              plan_id: 0,
              plan_time: new Date().toISOString(),
              work_date: cursor,
              process_id: op.process_id,
              order_no: order.order_no,
              part_no: item.part_no,
              op_seq: op.op_seq,
              alloc_hours: alloc,
              source: 'auto',
              note: null,
            });
          }
          if (remaining > 0) {
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            cursor = toDateKey(prev);
            if (!calendarMap[op.process_id]?.[cursor] && (usedMap[op.process_id]?.[cursor] || 0) === 0) {
              // 防止无限循环，预先填补默认 0 产能
              calendarMap[op.process_id] = calendarMap[op.process_id] || {};
              calendarMap[op.process_id][cursor] = 0;
            }
          }
          if (cursor < '1970-01-01') break;
        }

        if (remaining > 0) {
          feasible = false;
          previewResults.push({
            order_no: order.order_no,
            part_no: item.part_no,
            feasible: false,
            bottleneck: `${op.process_id} 在 ${cursor} 附近产能不足`,
          });
          break;
        }

        if (!options.allowSameDayHandoff && earliestUsed) {
          const prev = new Date(earliestUsed);
          prev.setDate(prev.getDate() - 1);
          latestDate = toDateKey(prev);
        } else if (earliestUsed) {
          latestDate = earliestUsed;
        }
      }

      if (feasible) {
        allocations.push(...itemAllocations);
        previewResults.push({
          order_no: order.order_no,
          part_no: item.part_no,
          feasible: true,
          finish_date: latestDate,
        });
      }
    });
  });

  return { allocations, previewResults };
}
