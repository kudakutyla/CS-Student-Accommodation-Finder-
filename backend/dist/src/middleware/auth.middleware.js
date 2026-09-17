"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.requireVerifiedLandlord = requireVerifiedLandlord;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, response_1.sendError)(res, 'Authentication required. No token provided.', 401);
            return;
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-32char-long';
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, secret);
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                (0, response_1.sendError)(res, 'Token expired. Please log in again.', 401);
                return;
            }
            (0, response_1.sendError)(res, 'Invalid token. Authentication failed.', 401);
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            (0, response_1.sendError)(res, 'User account not found or deactivated.', 401);
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
        };
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        (0, response_1.sendError)(res, 'Internal authentication error.', 500);
    }
}
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required.', 401);
            return;
        }
        if (!roles.includes(req.user.role)) {
            const allowedRoles = roles.map((role) => role.toLowerCase()).join(' or ');
            const displayRoles = roles.length === 1 ? `${roles[0].toLowerCase()}s` : allowedRoles;
            (0, response_1.sendError)(res, `Only ${displayRoles} can perform this action.`, 403);
            return;
        }
        next();
    };
}
function requireVerifiedLandlord(req, res, next) {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Authentication required.', 401);
        return;
    }
    if (req.user.role !== 'LANDLORD') {
        (0, response_1.sendError)(res, 'Only landlords can perform this action.', 403);
        return;
    }
    if (!req.user.isVerified) {
        (0, response_1.sendError)(res, 'Your landlord account must be verified before you can create a listing.', 403);
        return;
    }
    next();
}
