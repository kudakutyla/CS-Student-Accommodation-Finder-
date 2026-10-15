"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const campus_routes_1 = __importDefault(require("./routes/campus.routes"));
const listing_routes_1 = __importDefault(require("./routes/listing.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_report_routes_1 = __importDefault(require("./routes/admin.report.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const response_1 = require("./utils/response");
exports.app = (0, express_1.default)();
// Security middleware
exports.app.use((0, helmet_1.default)());
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
exports.app.use((0, cors_1.default)({
    origin: [
        clientUrl,
        'https://cs-student-accommodation-finder.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // max 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});
exports.app.use('/api', limiter);
// Body parser
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check Endpoint (Required by Specification)
exports.app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Student Accommodation Finder API is running',
    });
});
// Root route for convenience
exports.app.get('/', (_req, res) => {
    (0, response_1.sendSuccess)(res, { version: '1.0.0' }, 'Student Accommodation Finder API is online');
});
// API Routes
exports.app.use('/api/auth', auth_routes_1.default);
exports.app.use('/api/campuses', campus_routes_1.default);
exports.app.use('/api/listings', listing_routes_1.default);
exports.app.use('/api/reports', report_routes_1.default);
exports.app.use('/api/users', user_routes_1.default);
exports.app.use('/api/conversations', conversation_routes_1.default);
exports.app.use('/api/notifications', notification_routes_1.default);
exports.app.use('/api/admin', admin_routes_1.default);
exports.app.use('/api/admin/reports', admin_report_routes_1.default);
exports.app.use('/api/media', media_routes_1.default);
// 404 handler
exports.app.use((_req, res) => {
    (0, response_1.sendError)(res, 'Requested resource or API endpoint not found', 404);
});
// Global error handler
exports.app.use((err, _req, res, _next) => {
    if (err instanceof multer_1.default.MulterError || err.message.startsWith('Choose a supported image')) {
        (0, response_1.sendError)(res, err.message, 400);
        return;
    }
    console.error('Unhandled error:', err);
    const message = process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred'
        : err.message || 'Internal server error';
    (0, response_1.sendError)(res, message, 500);
});
exports.default = exports.app;
