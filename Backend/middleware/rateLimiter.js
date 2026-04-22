const rateLimit = require('express-rate-limit');

// General Limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

// Login Limiter: 5 requests per minute
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many login attempts, please try again after a minute.' }
});

// OTP Limiter: 3 requests per minute
const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { error: 'Too many OTP requests, please try again after a minute.' }
});

module.exports = {
    generalLimiter,
    loginLimiter,
    otpLimiter
};
