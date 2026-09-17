"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_validator_1 = require("../validators/auth.validator");
const response_1 = require("../utils/response");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-32char-long';
function generateToken(userId, role, email) {
    return jsonwebtoken_1.default.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '7d' });
}
async function register(req, res) {
    try {
        // Explicit security check: Admin registration cannot happen publicly
        if (req.body && req.body.role === 'ADMIN') {
            (0, response_1.sendError)(res, 'Admin accounts cannot be registered publicly.', 400);
            return;
        }
        const parseResult = auth_validator_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0].message, 400, parseResult.error.format());
            return;
        }
        const { name, email, password, phone, role } = parseResult.data;
        // Check if user already exists
        const existing = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existing) {
            (0, response_1.sendError)(res, 'A user with this email already exists.', 409);
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                phone: phone || null,
                role: role,
                isVerified: false,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
            },
        });
        const token = generateToken(user.id, user.role, user.email);
        (0, response_1.sendSuccess)(res, {
            user,
            token,
        }, 'Registration successful', 201);
    }
    catch (error) {
        console.error('Registration error:', error);
        (0, response_1.sendError)(res, 'An error occurred while creating your account.', 500);
    }
}
async function login(req, res) {
    try {
        const parseResult = auth_validator_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0].message, 400);
            return;
        }
        const { email, password } = parseResult.data;
        const user = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid email or password.', 401);
            return;
        }
        if (!user.isActive) {
            (0, response_1.sendError)(res, 'This account has been deactivated. Please contact support.', 403);
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            (0, response_1.sendError)(res, 'Invalid email or password.', 401);
            return;
        }
        const token = generateToken(user.id, user.role, user.email);
        (0, response_1.sendSuccess)(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified,
                isActive: user.isActive,
                createdAt: user.createdAt,
            },
            token,
        }, 'Login successful');
    }
    catch (error) {
        console.error('Login error:', error);
        (0, response_1.sendError)(res, 'An error occurred during login.', 500);
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Not authenticated', 401);
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
            },
        });
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { user });
    }
    catch (error) {
        console.error('GetMe error:', error);
        (0, response_1.sendError)(res, 'An error occurred fetching profile.', 500);
    }
}
async function logout(_req, res) {
    (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
}
