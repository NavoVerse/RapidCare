const request = require('supertest');
const { app, server } = require('../server');
const { knex } = require('../db');

/**
 * RapidCare — Trip Lifecycle Integration Tests
 */
describe('Trip Lifecycle Integration Tests', () => {
    
    beforeAll(async () => {
        // Reset database
        await knex.migrate.rollback(null, true);
        await knex.migrate.latest();
    });

    afterAll(async () => {
        await knex.destroy();
        server.close();
    });

    let patientToken, driverToken, hospitalToken;
    let patientId, driverId, hospitalUserId;
    let tripId;

    test('Step 0: Setup Environment (Create Users)', async () => {
        // Register Patient
        const pRes = await request(app).post('/api/v1/auth/register').send({
            name: 'Patient User', email: 'p@test.com', password: 'password123', role: 'patient'
        });
        patientId = pRes.body.userId;
        patientToken = (await request(app).post('/api/v1/auth/login').send({ email: 'p@test.com', password: 'password123' })).body.token;

        // Register Driver
        const dRes = await request(app).post('/api/v1/auth/register').send({
            name: 'Driver User', email: 'd@test.com', password: 'password123', role: 'driver'
        });
        driverId = dRes.body.userId;
        driverToken = (await request(app).post('/api/v1/auth/login').send({ email: 'd@test.com', password: 'password123' })).body.token;
        
        // Update driver location to be available (required by dispatcher)
        await knex('drivers').where({ user_id: driverId }).update({
            current_lat: 12.9716,
            current_lng: 77.5946,
            status: 'available'
        });

        // Register Hospital
        const hRes = await request(app).post('/api/v1/auth/register').send({
            name: 'City Hospital', email: 'h@test.com', password: 'password123', role: 'hospital'
        });
        hospitalUserId = hRes.body.userId;
        hospitalToken = (await request(app).post('/api/v1/auth/login').send({ email: 'h@test.com', password: 'password123' })).body.token;

        expect(patientToken).toBeDefined();
        expect(driverToken).toBeDefined();
        expect(hospitalToken).toBeDefined();
    });

    test('Step 1: Patient requests a trip', async () => {
        const res = await request(app)
            .post('/api/v1/trips/request')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                pickup_lat: 12.9710,
                pickup_lng: 77.5940,
                hospital_id: hospitalUserId
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('trip_id');
        tripId = res.body.trip_id;
        
        const trip = await knex('trips').where({ id: tripId }).first();
        expect(trip.status).toEqual('requested');
        expect(trip.driver_id).toEqual(driverId);
    });

    test('Step 2: Driver accepts the trip', async () => {
        const res = await request(app)
            .post(`/api/v1/trips/${tripId}/accept`)
            .set('Authorization', `Bearer ${driverToken}`);
        
        expect(res.statusCode).toEqual(200);
        
        const trip = await knex('trips').where({ id: tripId }).first();
        expect(trip.status).toEqual('accepted');
        
        const driver = await knex('drivers').where({ user_id: driverId }).first();
        expect(driver.status).toEqual('busy');
    });

    test('Step 3: Driver updates status to arrived', async () => {
        const res = await request(app)
            .put(`/api/v1/trips/${tripId}/status`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ status: 'arrived' });
        
        expect(res.statusCode).toEqual(200);
        
        const trip = await knex('trips').where({ id: tripId }).first();
        expect(trip.status).toEqual('arrived');
    });

    test('Step 4: Driver completes the trip', async () => {
        const res = await request(app)
            .put(`/api/v1/trips/${tripId}/status`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ status: 'completed' });
        
        expect(res.statusCode).toEqual(200);
        
        const trip = await knex('trips').where({ id: tripId }).first();
        expect(trip.status).toEqual('completed');
        expect(trip.end_time).not.toBeNull();
        
        // Driver should be available again
        const driver = await knex('drivers').where({ user_id: driverId }).first();
        expect(driver.status).toEqual('available');
    });

    test('Step 5: Patient views trip history (Bonus check)', async () => {
        const res = await request(app)
            .get('/api/v1/analytics/patient')
            .set('Authorization', `Bearer ${patientToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.metrics.total_trips).toEqual(1);
    });
});
