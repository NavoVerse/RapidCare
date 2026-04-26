const request = require('supertest');
const { app, server } = require('../server');
const { knex } = require('../db');

/**
 * RapidCare — Auth Integration Tests
 */
describe('Auth API Endpoints', () => {
    
    beforeAll(async () => {
        // Ensure database is clean and migrated
        await knex.migrate.rollback(null, true);
        await knex.migrate.latest();
    });

    afterAll(async () => {
        await knex.destroy();
        server.close();
    });

    let testUser = {
        name: 'Test Patient',
        email: 'test_patient@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'patient'
    };

    let authToken = '';

    // 1. POST /api/v1/auth/register
    test('POST /api/v1/auth/register - Should create a new patient', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('userId');
    });

    test('POST /api/v1/auth/register - Should fail with duplicate email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error');
    });

    // 2. POST /api/v1/auth/login
    test('POST /api/v1/auth/login - Should return a JWT on success', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        authToken = res.body.token;
    });

    test('POST /api/v1/auth/login - Should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: 'wrong_password'
            });
        
        expect(res.statusCode).toEqual(401);
    });

    // 3. POST /api/v1/auth/request-otp
    test('POST /api/v1/auth/request-otp - Should trigger OTP', async () => {
        const res = await request(app)
            .post('/api/v1/auth/request-otp')
            .send({ email: testUser.email });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('OTP sent');
    });

    // 4. GET /api/v1/auth/profile
    test('GET /api/v1/auth/profile - Should return user data if authorized', async () => {
        const res = await request(app)
            .get('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toEqual(testUser.email);
    });

    test('GET /api/v1/auth/profile - Should fail without token', async () => {
        const res = await request(app).get('/api/v1/auth/profile');
        expect(res.statusCode).toEqual(401);
    });
});
