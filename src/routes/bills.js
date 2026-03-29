import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAllBills, getBillById, createBill, saveQR, deleteBill, getQRStoragePath, updatePlayerPayment } from '../services/db.js';
import { uploadQR, deleteQR } from '../services/storage.js';

const router = Router();

// GET /api/bills
router.get('/', async (req, res, next) => {
  try {
    res.json(await getAllBills());
  } catch (e) {
    next(e);
  }
});

// GET /api/bills/:id
router.get('/:id', async (req, res, next) => {
  try {
    const bill = await getBillById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill không tồn tại' });
    res.json(bill);
  } catch (e) {
    next(e);
  }
});

// POST /api/bills
router.post('/', async (req, res, next) => {
  try {
    const {
      sessionDate,
      courtAddress,
      bankQRCode,
      courtFee,
      shuttlecockCost,
      waterCost,
      otherCost,
      otherCostNote,
      players,
    } = req.body;

    if (!sessionDate || !courtAddress || !players?.length) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc: sessionDate, courtAddress, players',
      });
    }

    const totalAmount =
      Number(courtFee ?? 0) +
      Number(shuttlecockCost ?? 0) +
      Number(waterCost ?? 0) +
      Number(otherCost ?? 0);

    const billId = uuidv4();

    const bill = await createBill({
      id: billId,
      createdAt: new Date().toISOString(),
      sessionDate,
      courtAddress,
      courtFee: Number(courtFee ?? 0),
      shuttlecockCost: Number(shuttlecockCost ?? 0),
      waterCost: Number(waterCost ?? 0),
      otherCost: Number(otherCost ?? 0),
      otherCostNote: otherCostNote ?? '',
      totalAmount,
      players: players.map((p) => ({
        id: p.id ?? uuidv4(),
        name: p.name,
        percentage: Number(p.percentage),
        amount: Math.round((totalAmount * Number(p.percentage)) / 100),
        hasPaid: p.hasPaid ?? false,
      })),
    });

    // Upload QR lên Storage rồi lưu vào bảng qr_codes
    if (bankQRCode && bankQRCode.startsWith('data:')) {
      const { storagePath, publicUrl } = await uploadQR(billId, bankQRCode);
      await saveQR(billId, storagePath, publicUrl);
      bill.bankQRCode = publicUrl;
    }

    res.status(201).json(bill);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/bills/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const bill = await getBillById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill không tồn tại' });

    // Lấy storagePath từ bảng qr_codes rồi xóa khỏi Storage
    const storagePath = await getQRStoragePath(req.params.id);
    await deleteQR(storagePath);
    // deleteBill sẽ cascade xóa qr_codes
    await deleteBill(req.params.id);

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// PATCH /api/bills/:id/players/:playerId
router.patch('/:id/players/:playerId', async (req, res, next) => {
  try {
    const { hasPaid } = req.body;
    if (typeof hasPaid !== 'boolean') {
      return res.status(400).json({ message: 'hasPaid phải là boolean' });
    }
    const bill = await updatePlayerPayment(req.params.id, req.params.playerId, hasPaid);
    if (!bill) return res.status(404).json({ message: 'Bill hoặc player không tồn tại' });
    res.json(bill);
  } catch (e) {
    next(e);
  }
});

export default router;
