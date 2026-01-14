import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
  service: "Gmail", //for future use
  port: 465,
  secure: true, // Use true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL, // change it to real email
    pass: process.env.PASS, // change it to real password
  },
});

export const sendOtpMail = async (to, otp) => {
   await transporter.sendMail({
        from: process.env.EMAIL, // change it to real email
        to, // change it to real email
        subject: "Your Password Reset OTP",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #333;">Hello,</h2>
                <p style="color: #555;">Your OTP for password reset is:</p>
                <h1 style="color: #ff6f00; font-size: 24px; text-align: center;">${otp}</h1>
                <p style="color: #555;">Please use this OTP to reset your password. It will expire in 5 minutes.</p>
                <hr style="border-top: 1px solid #eee;">
                <p style="color: #777; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
        `,
   })
   console.log(`OTP email sent to ${to} with OTP: ${otp}`);
};

// import nodemailer from "nodemailer";

// let transporter;

// const createTransporter = async () => {
//   const testAccount = await nodemailer.createTestAccount();

//   transporter = nodemailer.createTransport({
//     host: testAccount.smtp.host,
//     port: testAccount.smtp.port,
//     secure: testAccount.smtp.secure,
//     auth: {
//       user: testAccount.user,
//       pass: testAccount.pass,
//     },
//   });
// };

// await createTransporter();


// export const sendOtpMail = async (to, otp) => {
//   const info = await transporter.sendMail({
//     from: '"Vingo FoodExpress" <no-reply@vingo.com>',
//     to,
//     subject: "Your Password Reset OTP",
//     html: `<h2>Your OTP is ${otp}</h2>`,
//   });

//   console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
// };
