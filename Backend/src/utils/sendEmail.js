import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"vidTube" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: ", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

// Email templates
const getVerificationEmailHTML = (username, verificationUrl) => {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #a855f7; font-size: 28px; margin: 0;">🎥 vidTube</h1>
            <p style="color: #94a3b8; margin-top: 5px;">Video Platform</p>
        </div>
        <h2 style="color: #f1f5f9; font-size: 22px;">Verify Your Email</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
            Hey <strong style="color: #e2e8f0;">${username}</strong>, welcome to vidTube! 
            Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #a855f7, #6366f1); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; display: inline-block;">
                ✅ Verify Email
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #475569; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} vidTube. All rights reserved.
        </p>
    </div>
    `;
};

const getPasswordResetEmailHTML = (username, resetUrl) => {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #a855f7; font-size: 28px; margin: 0;">🎥 vidTube</h1>
            <p style="color: #94a3b8; margin-top: 5px;">Video Platform</p>
        </div>
        <h2 style="color: #f1f5f9; font-size: 22px;">Reset Your Password</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
            Hey <strong style="color: #e2e8f0;">${username}</strong>, 
            we received a request to reset your password. Click the button below to proceed:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; display: inline-block;">
                🔐 Reset Password
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #475569; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} vidTube. All rights reserved.
        </p>
    </div>
    `;
};

export { sendEmail, getVerificationEmailHTML, getPasswordResetEmailHTML };
