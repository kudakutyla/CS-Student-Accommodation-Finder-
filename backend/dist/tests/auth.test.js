"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prisma_1 = __importDefault(require("../src/config/prisma"));
describe('Sprint 1: Authentication & Authorization Tests', () => {
    const testStudentEmail = `test_student_${Date.now()}@test.com`;
    const testLandlordEmail = `test_landlord_${Date.now()}@test.com`;
    let studentToken = '';
    let landlordToken = '';
    afterAll(async () => {
        // Cleanup created test users
        await prisma_1.default.user.deleteMany({
            where: {
                email: {
                    in: [testStudentEmail, testLandlordEmail, 'malicious_admin@test.com'],
                },
            },
        });
    });
    describe('Health check endpoint', () => {
        it('GET /api/health returns 200 with success status', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Student Accommodation Finder API is running');
        });
    });
    describe('POST /api/auth/register', () => {
        it('should successfully register a student', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Test Student',
                email: testStudentEmail,
                password: 'Password123!',
                phone: '+27 71 000 0001',
                role: 'STUDENT',
            });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testStudentEmail.toLowerCase());
            expect(res.body.data.user.role).toBe('STUDENT');
            expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose passwordHash
            expect(res.body.data.token).toBeDefined();
        });
        it('should successfully register a landlord (starts unverified)', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Test Landlord',
                email: testLandlordEmail,
                password: 'Password123!',
                phone: '+27 82 000 0002',
                role: 'LANDLORD',
            });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.role).toBe('LANDLORD');
            expect(res.body.data.user.isVerified).toBe(false);
            expect(res.body.data.user.passwordHash).toBeUndefined();
        });
        it('SECURITY: should REJECT public registration attempt with role ADMIN', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Malicious User',
                email: 'malicious_admin@test.com',
                password: 'Password123!',
                role: 'ADMIN',
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/admin/i);
        });
        it('should reject duplicate email registration', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Duplicate Student',
                email: testStudentEmail,
                password: 'Password123!',
                role: 'STUDENT',
            });
            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });
    });
    describe('POST /api/auth/login', () => {
        it('should successfully log in with correct student credentials and return JWT', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: testStudentEmail,
                password: 'Password123!',
            });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(testStudentEmail.toLowerCase());
            expect(res.body.data.user.passwordHash).toBeUndefined();
            studentToken = res.body.data.token;
        });
        it('should reject login with wrong password', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: testStudentEmail,
                password: 'WrongPassword!',
            });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid/i);
        });
        it('should reject login with non-existent email', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'nobody_exists_here@test.com',
                password: 'Password123!',
            });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return user profile when authenticated with valid token', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testStudentEmail.toLowerCase());
            expect(res.body.data.user.passwordHash).toBeUndefined();
        });
        it('should reject request without Bearer token', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
        it('should reject request with forged/invalid token', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid.jwt.token');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});
