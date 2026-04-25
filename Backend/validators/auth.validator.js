const { z } = require('zod');

// Reusable email or phone validator
const emailOrPhone = z.string().refine(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^\d{10}$/.test(val),
    "Must be a valid email or a 10-digit phone number"
);

// Schema for user registration
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: emailOrPhone,
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(['patient', 'driver', 'hospital'], {
        errorMap: () => ({ message: "Role must be 'patient', 'driver', or 'hospital'" })
    }),
    phone: z.string().optional()
});

// Schema for login
const loginSchema = z.object({
    email: emailOrPhone,
    password: z.string().min(1, "Password is required")
});

// Schema for requesting an OTP
const requestOtpSchema = z.object({
    email: emailOrPhone
});

// Schema for verifying an OTP
const verifyOtpSchema = z.object({
    email: emailOrPhone,
    otp: z.string().length(6, "OTP must be exactly 6 digits")
});

module.exports = {
    registerSchema,
    loginSchema,
    requestOtpSchema,
    verifyOtpSchema
};
