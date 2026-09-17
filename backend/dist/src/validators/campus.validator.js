"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleCampusStatusSchema = exports.updateCampusSchema = exports.createCampusSchema = void 0;
const zod_1 = require("zod");
exports.createCampusSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Campus name must be at least 2 characters'),
    location: zod_1.z.string().min(2, 'Location/City is required'),
    address: zod_1.z.string().min(5, 'Address is required'),
    latitude: zod_1.z.number().min(-90).max(90, 'Invalid latitude coordinate'),
    longitude: zod_1.z.number().min(-180).max(180, 'Invalid longitude coordinate'),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateCampusSchema = exports.createCampusSchema.partial();
exports.toggleCampusStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean({ required_error: 'isActive status is required' }),
});
