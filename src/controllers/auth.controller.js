import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AuthService from "../services/auth.service.js";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

class AuthController {
  // User Registration
  static async signUp(req, res) {
    try {
      const { fullName, email, password, mobile, role } = req.body;

      // Check if user already exists
      const user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          status: "fail",
          message: "User already exits",
          data: {},
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
      const newUser = {
        fullName,
        email,
        password: hashedPassword,
        mobile,
        role,
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

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(201).json({
        status: "Success",
        message: "User registered successfully",
        data: { user: createdUser },
      });
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: "fail",
          message: "Email and password are required",
          data: {},
        });
      }

      const user = await User.findOne({ email });
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
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(200).json({
        status: "Success",
        message: "User logged in successfully",
        data: { user },
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
      res.clearCookie("token");
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

  static async sendOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          status: "fail",
          message: "Email is required",
          data: {},
        });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          status: "fail",
          message: "User does not exist",
          data: {},
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
      user.resetOtp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
      user.isOtpVerified = false;
      await user.save();

      sendOtpMail(email, otp);

      return res.status(200).json({
        status: "success",
        message: "OTP sent to email successfully",
        data: {},
      });
    } catch (error) {
      console.error("Error in sendOtp", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        data: {},
      });
    }
  }

  static async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          status: "fail",
          message: "Email and OTP are required",
          data: {},
        });
      }
      const user = await User.findOne({ email });
      if (!user || user.resetOtp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid or expired OTP",
          data: {},
        });
      }

      // OTP valid → lock identity
      //   const resetToken = jwt.sign(
      //     { userId: user._id },
      //     process.env.JWT_SECRET,
      //     { expiresIn: "10m" }
      //   );
      const resetToken = await genToken(user._id);

      res.cookie("resetToken", resetToken, {
        httpOnly: true,
        secure: false, // true in production
        sameSite: "strict",
      });

      user.isOtpVerified = true;
      user.resetOtp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(200).json({
        status: "success",
        message: "OTP verified successfully",
        data: {},
      });
    } catch (error) {
      console.error("Error in verifyOtp", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        data: {},
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      //   const { email, newPassword } = req.body;

      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          status: "fail",
          message: "New password is required",
          data: {},
        });
      }

      // read the token from cookies
      const token = req.cookies.resetToken;

      if (!token) {
        return res.status(401).json({
          status: "fail",
          message: "Unauthorized reset attempt",
          data: {},
        });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      //   const user = await User.findOne({ email });

      if (!user || user.isOtpVerified === false) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid reset token | otp verification required",
          data: {},
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.isOtpVerified = false;
      await user.save();

      res.clearCookie("resetToken");

      return res.status(200).json({
        status: "Success",
        message: "Password reset successfully",
        data: {},
      });
    } catch (error) {
      console.error("Error in resetPassword", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        data: {},
      });
    }
  }

  static async googleAuth(req, res) {
    try {
        const { fullName, email, mobile, role } = req.body;
        let user = await User.findOne({ email });
        let isNewUser = false;
        if (!user) {
            user = await User.create({
                fullName,
                email,
                mobile,
                role
            });
            isNewUser = true;
        }

        const token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.status(200).json({
            status: "Success",
            message: isNewUser ? "User registered successfully" : "User logged in successfully",
            data: { user },
        });

    } catch (error) {
        console.error("Error in googleauth", error);
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          data: {},
        });
    }
  }

}

export default AuthController;
