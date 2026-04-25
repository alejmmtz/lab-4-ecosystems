import express from 'express';
import { NODE_ENV, PORT } from './config';
import cors, { CorsOptions } from 'cors';
import { errorsMiddleware } from './middlewares/errorsMiddleware';
import { router as authRouter } from './features/auth/auth.router';
import { router as orderRouter } from './features/order/order.router';
import { router as productRouter } from './features/product/product.router';
import { router as storeRouter } from './features/store/store.router';

const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (configuredCorsOrigins.length === 0) {
      callback(null, true);
      return;
    }

    callback(null, configuredCorsOrigins.includes(origin));
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World. This backend is up baby!');
});

app.use('/api/order', orderRouter);
app.use('/api/orders', orderRouter);
app.use('/auth', authRouter);
app.use('/api/product', productRouter);
app.use('/api/store', storeRouter);

app.use(errorsMiddleware);

if (NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
  });
}

export default app;
