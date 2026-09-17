"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Sprint 2: Campus Management Tests', () => {
    let adminToken = '';
    let studentToken = '';
    let createdCampusId = '';
    beforeAll(async () => {
        const adminRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'admin@finder.co.za',
            password: 'AdminPass123!',
        });
        adminToken = adminRes.body.data.token;
        const studentRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'student@finder.co.za',
            password: 'StudentPass123!',
        });
        studentToken = studentRes.body.data.token;
    });
    it('Public can fetch active campuses', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/campuses');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].name).toBeDefined();
        expect(res.body.data[0].latitude).toBeDefined();
        expect(res.body.data[0].longitude).toBeDefined();
    });
    it('Student cannot create campus (403)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/campuses')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
            name: 'Unauthorized Campus',
            location: 'Durban',
            address: '100 Beach Rd',
            latitude: -29.85,
            longitude: 31.02,
        });
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });
    it('Admin can successfully create a new campus', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/campuses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Stellenbosch University (Main)',
            location: 'Stellenbosch, Western Cape',
            address: 'Victoria St, Stellenbosch, 7600',
            latitude: -33.9321,
            longitude: 18.8644,
            isActive: true,
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Stellenbosch University (Main)');
        createdCampusId = res.body.data.id;
    });
    it('Admin can update campus details', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/campuses/${createdCampusId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            location: 'Stellenbosch Central',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.location).toBe('Stellenbosch Central');
    });
    it('Admin can toggle campus active status', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/campuses/${createdCampusId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            isActive: false,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.isActive).toBe(false);
        // Inactive campus should not appear in default public list
        const publicCampuses = await (0, supertest_1.default)(app_1.default).get('/api/campuses');
        const found = publicCampuses.body.data.find((c) => c.id === createdCampusId);
        expect(found).toBeUndefined();
    });
});
