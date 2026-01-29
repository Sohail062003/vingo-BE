import express from 'express'
import ItemController from '../controllers/item.controller.js';
import isAuth from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';


const route = express.Router();


route.get("/get-by-id/:itemId", isAuth, ItemController.getItemById);
route.post("/add-item", isAuth, upload.single("image"),ItemController.addItem);
route.post("/edit-item/:itemId", isAuth, upload.single("image"), ItemController.editItem);
route.get("/delete-item/:itemId", isAuth, ItemController.deleteItem);
route.get("/get-by-city/:city", isAuth, ItemController.getItemByCity);

export default route;