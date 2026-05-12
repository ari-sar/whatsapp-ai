import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes';
import adminAuthRoutes from './routes/adminAuthRoutes';
import adminPanelRoutes from './routes/adminPanelRoutes';
import webhookRoutes from './routes/webhookRoutes';
import authRoutes from './routes/authRoutes';
import meRoutes from './routes/meRoutes';
import plansRoutes from './routes/plansRoutes';
import flowsRoutes from './routes/flowsRoutes';
import paymentsRoutes from './routes/paymentsRoutes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());

// Configure express.json to capture raw body for signature verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Admin Panel API (allowlisted phones)
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/panel', adminPanelRoutes);

// Legacy admin (multi-tenant client CRUD)
app.use('/api/admin', adminRoutes);

// Portal API
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/flows', flowsRoutes);
app.use('/api/payments', paymentsRoutes);

// Webhook API
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
