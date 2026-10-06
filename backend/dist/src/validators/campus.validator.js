"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleCampusStatusSchema = exports.updateInstitutionSchema = exports.institutionSchema = exports.updateCampusSchema = exports.createCampusSchema = void 0;
const zod_1 = require("zod");
exports.createCampusSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Campus name must be at least 2 characters'),
    institutionId: zod_1.z.string().min(1, 'Institution is required'),
    location: zod_1.z.string().min(2, 'Location/City is required'),
    address: zod_1.z.string().min(5, 'Address is required'),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateCampusSchema = exports.createCampusSchema.partial();
exports.institutionSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(160),
    shortName: zod_1.z.string().max(40).optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateInstitutionSchema = exports.institutionSchema.partial();
exports.toggleCampusStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean({ required_error: 'isActive status is required' }),
});
