"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Sprint 1: Role-Based Authorization & Ownership Security Tests', () => {
    let studentToken = '';
    let verifiedLandlordToken = '';
    let unverifiedLandlordToken = '';
    let adminToken = '';
    let existingListingId = '';
    beforeAll(async () => {
        // Log in seed users
        const studentRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'student@finder.co.za',
            password: 'StudentPass123!',
        });
        studentToken = studentRes.body.data.token;
        const verifiedLandlordRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'landlord@finder.co.za',
            password: 'LandlordPass123!',
        });
        verifiedLandlordToken = verifiedLandlordRes.body.data.token;
        const unverifiedLandlordRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'unverified@finder.co.za',
            password: 'LandlordPass123!',
        });
        unverifiedLandlordToken = unverifiedLandlordRes.body.data.token;
        const adminRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'admin@finder.co.za',
            password: 'AdminPass123!',
        });
        adminToken = adminRes.body.data.token;
        // Get an existing listing ID
        const listingsRes = await (0, supertest_1.default)(app_1.default).get('/api/listings');
        existingListingId = listingsRes.body.data.items[0].id;
    }, 30000);
    describe('STUDENT Role Restrictions', () => {
        it('CRITICAL RULE: Student MUST NOT be able to create accommodation listings (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/listings')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                title: 'Student Attempting Listing',
                description: 'This listing creation should be strictly blocked by backend RBAC.',
                pricePerMonth: 4000,
                accommodationType: 'ROOM',
                address: '123 Fake St',
                latitude: -25.75,
                longitude: 28.23,
                totalRooms: 1,
                availableRooms: 1,
                campusId: 'some-id',
                photos: ['https://example.com/pic.jpg'],
            });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/only landlords/i);
        });
        it('Student cannot access admin pending listings queue (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/listings/pending')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });
    describe('LANDLORD Role & Verification Restrictions', () => {
        it('CRITICAL RULE: UNVERIFIED landlord CANNOT create/submit listings (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/listings')
                .set('Authorization', `Bearer ${unverifiedLandlordToken}`)
                .send({
                title: 'Unverified Landlord Listing',
                description: 'This should fail because isVerified is false.',
                pricePerMonth: 4500,
                accommodationType: 'ROOM',
                address: '456 Test St',
                latitude: -25.75,
                longitude: 28.23,
                totalRooms: 2,
                availableRooms: 1,
                campusId: 'some-id',
                photos: ['https://example.com/pic.jpg'],
            });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Your landlord account must be verified before you can create a listing.');
        });
        it('Landlord cannot access Admin dashboard / pending queues (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/listings/pending')
                .set('Authorization', `Bearer ${verifiedLandlordToken}`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
        it('Landlord cannot approve listings (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/listings/${existingListingId}/approve`)
                .set('Authorization', `Bearer ${verifiedLandlordToken}`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
        it('Ownership check: Landlord cannot edit another landlord listing (403)', async () => {
            // Unverified landlord attempts to edit verified landlord's listing
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/listings/${existingListingId}`)
                .set('Authorization', `Bearer ${unverifiedLandlordToken}`)
                .send({
                title: 'Hacked Title By Other Landlord',
            });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/forbidden|only modify your own/i);
        });
    });
    describe('ADMIN Role Privileges', () => {
        it('Admin can access pending listings queue', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/listings/pending')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
});
