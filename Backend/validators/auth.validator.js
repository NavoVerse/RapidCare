const { z } = require('zod');

// Schema for user registration
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(['patient', 'driver', 'hospital'], {
        errorMap: () => ({ message: "Role must be 'patient', 'driver', or 'hospital'" })
    }),
    phone: z.string().optional()
});

// Schema for login
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required")
});

// Schema for requesting an OTP
const requestOtpSchema = z.object({
    email: z.string().email("Invalid email address")
});

// Schema for verifying an OTP
const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits")
});

module.exports = {
    registerSchema,
    loginSchema,
    requestOtpSchema,
    verifyOtpSchema
};
