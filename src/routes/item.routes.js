import express from 'express'
import ItemController from '../controllers/item.controller.js';
import isAuth from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';


const route = express.Router();


route.post("/add-item", isAuth, upload.single("image"),ItemController.addItem);
route.post("/edit-item/:itemId", isAuth, ItemController.editItem);


export default route;