# 高端 ERP 风格 · 自动排程演示站点

React 18 + Vite + TypeScript + Tailwind 构建，前端直连 Supabase PostgREST（未使用 Supabase Auth），可一键部署到 Vercel。路由模块化，可单独打开登录、个人中心、看板、订单、工艺、影响分析与数据表字典等页面。

## 核心特性
- **自定义登录**：依据 `employee_user` 表校验明文/哈希密码，记住密码（本地 base64，仅演示），登录态写入 `localStorage`。
- **头像闭环**：`/me` & 看板完成 avatars bucket 上传 → `employee_user.avatar_path` 更新，公有 bucket 直接展示。
- **ERP 布局**：`AppShell` 提供左侧导航 + 顶部栏，页卡圆角 2xl、轻阴影，整体 slate 商务配色。
- **排程看板**：订单池拖动、参数切换、热力/可行性预览（默认空数据，接入 Supabase 表后生效）。
- **模块拆分**：`/orders`、`/steps`、`/impact`、`/tables` 等页面独立路由，可直接通过 URL 打开。

## 环境变量
在 Vercel 或 `.env` 中提供（已内置演示回退值，正式部署请替换）：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 必要表结构（Postgres / Supabase）
- `department(department_id int pk, dep_name text)`
- `employee_user(emp_id uuid pk, login_name text unique, emp_name text, department_id int, pwd text, role text, is_active bool, remark text, avatar_path text)`
- `file_object(file_id uuid pk, owner_emp_id uuid, file_kind text, origin_name text, mime_type text, size_bytes bigint, bucket text, object_path text, is_public bool, created_at timestamptz)`
- 排程相关：`process_master`、`process_calendar_day`、`step_template`、`order_header`、`order_item`、`plan_allocation_day`
- Storage bucket：`avatars`（演示建议 public 并给 anon upload/read 策略）

## 开发与构建
```bash
npm install
npm run dev   # 本地调试
npm run build # 产出 dist，用于 Vercel 静态部署
```

## 代码结构
- `src/lib/supabase.ts`：Supabase client，含内置演示 URL/anon key 回退
- `src/lib/auth.ts`：登录、session、记住密码工具 & Profile 查询
- `src/lib/scheduler.ts`：前端倒排算法（安全天数、同日衔接）
- `src/lib/mockData.ts`：空数组占位，等待 Supabase 数据接入
- `src/components/AppShell.tsx`：高端 ERP 布局
- `src/pages/*.tsx`：路由页面（Login/Me/Board/Orders/Steps/Impact/Tables）

## 头像上传流程（/me 页面）
1. 选择 jpg/png/webp（<=2MB）。
2. 生成 `{emp_id}/avatar_<timestamp>.<ext>`。
3. `supabase.storage.from('avatars').upload(object_path, file, { upsert:true })`。
4. 更新 `employee_user.avatar_path`（如需元数据可自行写 `file_object`）。
5. 优先用 `getPublicUrl` 展示头像。

## 部署提示
- Vercel 项目设置中添加环境变量（若保留默认演示值即可开箱体验）。
- 构建命令 `npm run build`，输出目录 `dist`。
- 演示期未启用 RLS，正式环境请按需加策略。
