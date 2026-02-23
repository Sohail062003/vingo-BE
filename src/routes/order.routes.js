import express from 'express'
import OrderController from '../controllers/order.controller.js';
import isAuth from '../middlewares/isAuth.js';


const route = express.Router();

route.get("/my-orders", isAuth ,OrderController.getMyOrders);
route.get("/get-assignments", isAuth ,OrderController.getDeliveryBoyAssignment);
route.get("/get-current-order", isAuth, OrderController.getCurrentOrder);

route.post("/place-order", isAuth ,OrderController.placeOrder);
route.post("/update-status/:orderId/:shopId", isAuth, OrderController.updateOrderStatus);
route.post("/accept-order/:assignedId", isAuth, OrderController.acceptOrder);


export default route;