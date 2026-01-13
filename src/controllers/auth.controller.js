import bcrypt from 'bcryptjs';
import User from "../models/user.model.js";
import AuthService from "../services/auth.service.js";
import genToken from '../utils/token.js';

class AuthController {

    // User Registration
    static async signUp(req, res) {
        try {
            const {fullName, email, password, mobile, role} = req.body;

            // Check if user already exists
            const user = await User.findOne({email});

            if (user) {
                return res.status(400).json({
                    status: "fail",
                    message: "User already exits",
                    data: {}
                });
            }

            if (!fullName || !email || !password || !mobile || !role) {
                return res.status(400).json({
                    status: "fail",
                    message: "All fields are required",
                    data: {},
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    status: "fail",
                    message: "Password must be at least 6 characters",
                    data: {},
                });
            }

            if (mobile.length < 10) {
                 return res.status(400).json({
                    status: "fail",
                    message: "Mobile number must be at least 10 characters",
                    data: {},
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user object
            const newUser =  {
                fullName,
                email,
                password: hashedPassword,
                mobile,
                role  
            };

            const createdUser = await AuthService.signUp(newUser);

            if (!createdUser) {
                return res.status(400).json({
                    status: "fail",
                    message: "User registration failed",
                    data: {},
                });
            }

            // Generate token
            const token = await genToken(createdUser._id);

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            return res.status(201).json({
                status: "Success",
                message: "User registered successfully",
                data: {user: createdUser},
            })

        } catch (error) {
            console.error("Error in signUp:", error);
            return res.status(500).json({
                status: "error",
                message: "Internal server error",
                data: {},
            });
        }
    }

    // user Login
    static async signIn(req, res) {
        try {
            const {email, password} = req.body; 

            if (!email || !password) {
                return res.status(400).json({
                    status: "fail",
                    message: "Email and password are required",
                    data: {},
                });
            }

            const user = await User.findOne({email});
            if (!user) {
                return res.status(400).json({
                    status: "fail",
                    message: "User doen not exist",
                    data: {},
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    status: "fail",
                    message: "Invalid Password",
                    data: {},
                });
            }

            const token = await genToken(user._id);
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            return res.status(200).json({
                status: "Success",
                message: "User logged in successfully",
                data: {user},
            });

        } catch (error) {
            console.error("Error in signIn", error);
            return res.status(500).json({
                status: "error",
                message: "Internal server error",
                data: {},
            });
        }
    }

    // user logout
    static async signOut(req, res) {
        try {
            res.clearCookie('token');
            return res.status(200).json({
                status: "Success",
                message: "User logged out successfully",
                data: {},
            });
        } catch (error) {
            console.error("Error in signOut", error);
            return res.status(500).json({
                status: "error",
                message: "Internal server error",
                data: {},
            });
        }
    }
    
}

export default AuthController;