import { supabase } from '../supabase.js';

const BUCKET = 'qr-codes';

/**
 * Upload ảnh QR từ base64 data URL lên Supabase Storage.
 * @param {string} billId
 * @param {string} base64DataUrl  - "data:image/png;base64,ABC..."
 * @returns {{ storagePath: string, publicUrl: string }}
 */
export async function uploadQR(billId, base64DataUrl) {
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('base64DataUrl không hợp lệ');

  const mimeType = matches[1];
  const ext = mimeType.split('/')[1] ?? 'png';
  const buffer = Buffer.from(matches[2], 'base64');
  const storagePath = `bills/${billId}/qr.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload QR thất bại: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

/**
 * Xóa file QR khỏi Storage theo đường dẫn đã lưu trong DB.
 * @param {string} storagePath
 */
export async function deleteQR(storagePath) {
  if (!storagePath) return;
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
