import express from 'express'
import OrderController from '../controllers/order.controller.js';
import isAuth from '../middlewares/isAuth.js';


const route = express.Router();

route.post("/place-order", isAuth ,OrderController.placeOrder);



export default route;