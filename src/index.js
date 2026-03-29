import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import billsRouter from './routes/bills.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: '10mb' })); // limit cao hơn vì QR code là base64

app.use('/api/bills', billsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Route không tồn tại' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi server' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
