import express from 'express';
import AuthController from '../controllers/auth.controller.js';

const route = express.Router();

route.post('/signup', AuthController.signUp);
route.post('/signin', AuthController.signIn);
route.post('/signout', AuthController.signOut);

export default route;




