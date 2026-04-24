import express from 'express';
import { NODE_ENV, PORT } from './config';
import cors from 'cors';
import { errorsMiddleware } from './middlewares/errorsMiddleware';
import { router as authRouter } from './features/auth/auth.router';
import { router as orderRouter } from './features/order/order.router';
import { router as productRouter } from './features/product/product.router';
import { router as storeRouter } from './features/store/store.router';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, World. This backend is up baby!');
});

// Routes
app.use('/api/order', orderRouter);
app.use('/auth', authRouter);
app.use('/api/product', productRouter);
app.use('/api/store', storeRouter);

// Error handling middleware
app.use(errorsMiddleware);

if (NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
  });
}

export default app;
