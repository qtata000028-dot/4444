import { OrderHeader, OrderItem, ProcessCalendarDay, StepTemplate } from '../types';

export const mockOrders: OrderHeader[] = [
  { order_no: 'SO-1001', rank_no: 1, settle_date: '2024-12-15', release_date: '2024-12-01', status: '未排', note: '优先单' },
  { order_no: 'SO-1002', rank_no: 2, settle_date: '2024-12-20', release_date: '2024-12-05', status: '未排', note: '常规' },
  { order_no: 'SO-1003', rank_no: 3, settle_date: '2024-12-25', release_date: '2024-12-10', status: '未排', note: '新产品' },
];

export const mockItems: OrderItem[] = [
  { order_no: 'SO-1001', part_no: 'P-001', qty: 120, step_id: 'STEP-CNC' },
  { order_no: 'SO-1002', part_no: 'P-002', qty: 80, step_id: 'STEP-CNC' },
  { order_no: 'SO-1003', part_no: 'P-003', qty: 60, step_id: 'STEP-CNC' },
];

export const mockSteps: StepTemplate[] = [
  {
    step_id: 'STEP-CNC',
    step_name: '精加工流程',
    version: 'v1',
    is_active: true,
    remark: '演示用三段工序',
    ops_json: [
      { op_seq: 10, process_id: 'CNC', setup_min: 30, run_min_per_piece: 4 },
      { op_seq: 20, process_id: 'POLISH', setup_min: 20, run_min_per_piece: 3 },
      { op_seq: 30, process_id: 'QC', setup_min: 10, run_min_per_piece: 2 },
    ],
  },
];

export const mockCalendar: ProcessCalendarDay[] = Array.from({ length: 10 }).flatMap((_, idx) => {
  const date = new Date('2024-12-15');
  date.setDate(date.getDate() + idx);
  const work_date = date.toISOString().slice(0, 10);
  return [
    { process_id: 'CNC', work_date, avail_hours: 16 },
    { process_id: 'POLISH', work_date, avail_hours: 12 },
    { process_id: 'QC', work_date, avail_hours: 10 },
  ];
});
