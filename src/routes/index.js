import express from 'express';
const router = express.Router();


import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import shopRoutes from './shop.routes.js';
import ItemRoutes from './item.routes.js';
import OrderRoutes from './order.routes.js';

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/shop', shopRoutes);
router.use('/item', ItemRoutes);
router.use('/order', OrderRoutes);


export default router;
