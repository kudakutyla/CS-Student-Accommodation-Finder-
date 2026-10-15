"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const server = app_1.default.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`Student Accommodation Finder API running`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
