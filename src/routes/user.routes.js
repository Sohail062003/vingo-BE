import express from 'express'
import UserController from '../controllers/user.controller.js';
import isAuth from '../middlewares/isAuth.js';


const route = express.Router();


route.get("/current-user", isAuth, UserController.getCurrentUser);


export default route;