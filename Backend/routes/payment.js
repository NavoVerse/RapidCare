const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/firebase');
const { knex } = require('../db');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// Create Order API
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        
        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        
        if (!order) {
            return res.status(500).json({ success: false, message: 'Failed to create order' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Payment and Save to Databases
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentDetails
        } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // 1. Save to Firebase (Cloud)
            if (db) {
                try {
                    await db.collection('payments').add({
                        order_id: razorpay_order_id,
                        payment_id: razorpay_payment_id,
                        status: 'successful',
                        amount: paymentDetails?.amount || 0,
                        user_id: paymentDetails?.user_id || 'anonymous',
                        timestamp: new Date()
                    });
                } catch (fbError) {
                    console.error('Failed to save to Firebase:', fbError);
                }
            }

            // 2. Save to SQLite (Local)
            try {
                await knex('payments').insert({
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    status: 'successful',
                    amount: paymentDetails?.amount || 0,
                    user_id: paymentDetails?.user_id || 'anonymous',
                    payment_details: JSON.stringify(paymentDetails || {})
                });
            } catch (sqliteError) {
                console.error('Failed to save to SQLite:', sqliteError);
            }
            
            res.json({
                success: true,
                message: 'Payment verified and saved successfully',
                paymentId: razorpay_payment_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature. Payment verification failed.'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
