import express from 'express';
import AuthController from '../controllers/auth.controller.js';

const route = express.Router();

route.post('/signup', AuthController.signUp);
route.post('/signin', AuthController.signIn);
route.post('/signout', AuthController.signOut);
route.post('/send-otp', AuthController.sendOtp);
route.post('/verify-otp', AuthController.verifyOtp);
route.post('/reset-password', AuthController.resetPassword);
route.post('/google-auth', AuthController.googleAuth);

export default route;




