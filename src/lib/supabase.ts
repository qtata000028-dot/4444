import { createClient } from '@supabase/supabase-js';

// --- 硬编码配置 (Hardcoded Config) ---
const supabaseUrl = 'https://ugxkzfvdybzbsxitcybw.supabase.co';
const supabaseKey = 'sb_publishable_TTpGoAiJ9WIRWQ_gxAxb8Q_LQ9c6Yv2';

// --- 初始化客户端 ---
export const supabase = createClient(supabaseUrl, supabaseKey);

export function getPublicFileUrl(bucket: string, objectPath: string | null | undefined) {
  if (!objectPath) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || '';
}
