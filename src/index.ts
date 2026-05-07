import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes';
import webhookRoutes from './routes/webhookRoutes';

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

// Admin API
app.use('/api/admin', adminRoutes);

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
