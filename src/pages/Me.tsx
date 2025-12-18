import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { fetchProfile, getSession, logout, saveSession } from '../lib/auth';
import { getPublicFileUrl, supabase } from '../lib/supabase';
import { EmployeeProfile } from '../types';
import { Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MePage() {
  const session = getSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    fetchProfile(session.emp_id)
      .then((res) => {
        setProfile(res);
        setAvatarUrl(getPublicFileUrl('avatars', res?.avatar_path || session.avatar_path));
      })
      .catch((err) => setError((err as Error).message));
  }, [session]);

  const handleFile = async (file: File) => {
    if (!session) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('仅支持 jpg/png/webp');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('文件大小限制 2MB');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('');
    const ext = file.name.split('.').pop() || 'png';
    const object_path = `${session.emp_id}/avatar_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(object_path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('employee_user')
      .update({ avatar_path: object_path })
      .eq('emp_id', session.emp_id);
    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    const updatedSession = { ...session, avatar_path: object_path };
    saveSession(updatedSession);
    setAvatarUrl(getPublicFileUrl('avatars', object_path));
    setMessage('头像已更新');
    setUploading(false);
  };

  if (!session) return null;

  return (
    <AppShell title="我的信息" subtitle="头像、个人档案、退出登录">
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-white/80 p-6 shadow ring-1 ring-slate-200">
          <div className="group relative mx-auto h-40 w-40 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">未上传</div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="h-5 w-5 text-white" />
                  <span className="ml-2 text-sm text-white">更换头像</span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <div>姓名：{profile?.emp_name || session.emp_name}</div>
            <div>登录名：{profile?.login_name}</div>
            <div>部门：{profile?.department?.dep_name || '未分配'}</div>
            <div>角色：{profile?.role}</div>
            <div>上次登录：{localStorage.getItem('erp_last_login_time') || '-'}</div>
          </div>
          <button
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            退出登录
          </button>
          {message && <div className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">基本信息</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">员工 ID：{session.emp_id}</div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">部门 ID：{session.department_id ?? '未配置'}</div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">角色：{session.role}</div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">当前登录时间：{session.login_time}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">说明</h3>
            <p className="mt-2 text-sm text-slate-600">
              头像上传直接写入 Supabase Storage 的 avatars bucket，并在 employee_user.avatar_path 记录路径。
              bucket 为 public 时使用 getPublicUrl 即可展示，若改为私有可切换为 signedUrl。
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
