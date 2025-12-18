# 自动排程演示系统（React + Vite + Tailwind）

本项目实现“自动排程演示系统”，基于 React + Vite + TypeScript + Tailwind，面向 Vercel 部署，后端使用 Supabase (Postgres + PostgREST)。每个业务模块独立路由，可直接通过 URL 打开。

## 主要特性
- 登录鉴权：`employee_user` 表校验（明文演示密码），本地存储登录态。
- 排程看板 `/board`：订单池拖动排序、参数配置、安全缓冲、同日衔接开关、产能热力、预览分配、提交排程版本。
- 工艺步骤库 `/steps`：`step_template` CRUD，`ops_json` 表格编辑，关联 `process_master`。
- 订单模块 `/orders`：`order_header` + `order_item` 维护，拖动排序更新 `rank_no`。
- 工序日历 `/calendar`：`process_calendar_day` 维护与批量生成。
- 员工模块 `/employees`：`employee_user` CRUD，需 admin 角色。
- 影响分析 `/impact`：对比当前预览与基线 `plan_id` 的完工/缓冲变化。
- 排程算法：前端倒排，考虑安全天数、同日衔接、手工锁定（`plan_id=0`），生成 `plan_allocation_day` 分配。

## 运行与开发
1. 安装依赖（如网络限制导致无法下载 npm scoped 包，请配置可用镜像后再重试）：
   ```bash
   npm install
   npm run dev
   ```
2. 环境变量（`.env` 或 Vercel 项目设置）：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 推荐数据库表结构（字段即需求描述，可直接在 Supabase SQL Editor 创建）：
   - `employee_user(emp_id primary key, login_name, emp_name, pwd, role, is_active boolean, remark text)`
   - `process_master(process_id primary key, process_name, is_active boolean, remark text)`
   - `process_calendar_day(process_id references process_master, work_date date, avail_hours numeric, reason text)`
   - `step_template(step_id primary key, step_name, version, is_active boolean, ops_json jsonb, remark text)`
   - `order_header(order_no primary key, rank_no integer, release_date date, settle_date date, status text, note text)`
   - `order_item(order_no references order_header, part_no text, qty numeric, step_id references step_template, remark text)`
   - `plan_allocation_day(allocation_id bigserial primary key, plan_id integer, plan_time timestamptz, work_date date, process_id text, order_no text, part_no text, op_seq integer, alloc_hours numeric, source text, note text)`

   若有 `v_order_operation` 视图，可直接使用；否则前端从 `step_template.ops_json` 展开。

4. RLS 策略：演示环境可关闭；或对以上表添加 `anon` 允许 CRUD 的 policy 以便前端操作。
5. Vercel 部署：导入本仓库，添加上述环境变量，构建命令 `npm run build`，输出目录 `dist`。

## 模块路由
- `/login` 登录页
- `/board` 排程看板（聚合页）
- `/steps` 工艺步骤库（独立页）
- `/orders` 订单模块（独立页）
- `/calendar` 工序日历（独立页）
- `/employees` 员工模块（仅 admin）
- `/impact` 影响分析

## 代码结构
- `src/pages/*`：各路由页面
- `src/lib/scheduler.ts`：前端排程算法
- `src/lib/supabaseClient.ts`：PostgREST 轻量封装
- `src/components/*`：通用 UI 组件（TopBar/Card/ProtectedRoute 等）

## 注意
- 拖动排序使用原生 HTML5 DnD；成功排序后会更新内存状态，调用 Supabase 更新可按需扩展。
- 当前仓库未包含 node_modules；构建前需联网安装依赖。
