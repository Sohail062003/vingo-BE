import express from 'express'
import OrderController from '../controllers/order.controller.js';
import isAuth from '../middlewares/isAuth.js';


const route = express.Router();

route.post("/place-order", isAuth ,OrderController.placeOrder);
route.get("/my-orders", isAuth ,OrderController.getMyOrders);


export default route;