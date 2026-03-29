import { supabase } from '../supabase.js';

const BILLS = 'bills';
const QR_CODES = 'qr_codes';

/** Map DB row (với qr_codes joined) → camelCase Bill object cho frontend */
function toDTO(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    sessionDate: row.session_date,
    courtAddress: row.court_address,
    bankQRCode: row.qr_codes?.[0]?.public_url ?? '',
    courtFee: row.court_fee,
    shuttlecockCost: row.shuttlecock_cost,
    waterCost: row.water_cost,
    otherCost: row.other_cost,
    otherCostNote: row.other_cost_note ?? '',
    totalAmount: row.total_amount,
    players: row.players ?? [],
  };
}

export async function getAllBills() {
  const { data, error } = await supabase
    .from(BILLS)
    .select('*, qr_codes(public_url)')
    .order('session_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(toDTO);
}

export async function getBillById(id) {
  const { data, error } = await supabase
    .from(BILLS)
    .select('*, qr_codes(storage_path, public_url)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return toDTO(data);
}

/** Lấy storage_path của QR để xóa khỏi Storage */
export async function getQRStoragePath(billId) {
  const { data } = await supabase
    .from(QR_CODES)
    .select('storage_path')
    .eq('bill_id', billId)
    .single();

  return data?.storage_path ?? null;
}

export async function createBill(bill) {
  const { data, error } = await supabase
    .from(BILLS)
    .insert({
      id: bill.id,
      created_at: bill.createdAt,
      session_date: bill.sessionDate,
      court_address: bill.courtAddress,
      court_fee: bill.courtFee,
      shuttlecock_cost: bill.shuttlecockCost,
      water_cost: bill.waterCost,
      other_cost: bill.otherCost,
      other_cost_note: bill.otherCostNote,
      total_amount: bill.totalAmount,
      players: bill.players,
    })
    .select('*, qr_codes(public_url)')
    .single();

  if (error) throw new Error(error.message);
  return toDTO(data);
}

export async function saveQR(billId, storagePath, publicUrl) {
  const { error } = await supabase
    .from(QR_CODES)
    .insert({ bill_id: billId, storage_path: storagePath, public_url: publicUrl });

  if (error) throw new Error(error.message);
}

export async function deleteBill(id) {
  // qr_codes tự xóa nhờ ON DELETE CASCADE
  const { error } = await supabase.from(BILLS).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updatePlayerPayment(billId, playerId, hasPaid) {
  const bill = await getBillById(billId);
  if (!bill) return null;

  const player = bill.players.find((p) => p.id === playerId);
  if (!player) return null;

  const updatedPlayers = bill.players.map((p) =>
    p.id === playerId ? { ...p, hasPaid } : p,
  );

  const { data, error } = await supabase
    .from(BILLS)
    .update({ players: updatedPlayers })
    .eq('id', billId)
    .select('*, qr_codes(public_url)')
    .single();

  if (error) throw new Error(error.message);
  return toDTO(data);
}
