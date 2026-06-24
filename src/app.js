import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import businessRoutes from './routes/business.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import knowledgeRoutes from './routes/knowledge.routes.js';
import templateRoutes from './routes/template.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();

app.set('trust proxy', 1); // Trust first proxy for Render to allow express-rate-limit to work correctly

app.use(helmet());
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'https://whtsup.netlify.app'],
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// IMPORTANT: webhook needs raw body for Meta signature verification
// Must be registered BEFORE express.json()
app.use('/webhook/whatsapp', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api', conversationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
