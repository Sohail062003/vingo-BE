import express from 'express'
import OrderController from '../controllers/order.controller.js';
import isAuth from '../middlewares/isAuth.js';


const route = express.Router();

route.get("/my-orders", isAuth ,OrderController.getMyOrders);
route.post("/place-order", isAuth ,OrderController.placeOrder);
route.post("/update-status/:orderId/:shopId", isAuth, OrderController.updateOrderStatus);


export default route;