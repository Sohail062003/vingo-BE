import express from 'express'
import ShopController from '../controllers/shop.controller.js';
import isAuth from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';



const route = express.Router();


route.post("/create-edit", isAuth, upload.single("image"),ShopController.createEditShop);
route.post("/get-shop", isAuth, ShopController.getMyShop);
route.get("/get-by-city/:city", isAuth, ShopController.getShopByCity);

export default route;