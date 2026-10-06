"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingSearchQuerySchema = exports.updateListingSchema = exports.createListingSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createListingSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    campusId: zod_1.z.string().min(1, 'Campus is required'),
    accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType, {
        errorMap: () => ({ message: 'Valid accommodation type is required' }),
    }),
    pricePerMonth: zod_1.z.coerce.number().positive('Monthly price must be greater than 0'),
    address: zod_1.z.string().min(3, 'Address is required'),
    totalRooms: zod_1.z.coerce.number().int().positive('Total rooms must be at least 1'),
    availableRooms: zod_1.z.coerce.number().int().min(0, 'Available rooms cannot be negative'),
    amenities: zod_1.z.preprocess((value) => {
        if (typeof value !== 'string')
            return value;
        try {
            return JSON.parse(value);
        }
        catch {
            return [value];
        }
    }, zod_1.z.array(zod_1.z.string()).default([])),
    availabilityStatus: zod_1.z.nativeEnum(client_1.ListingAvailability).optional().default(client_1.ListingAvailability.AVAILABLE),
})
    .refine((data) => data.availableRooms <= data.totalRooms, {
    message: 'Available rooms cannot exceed total rooms',
    path: ['availableRooms'],
});
exports.updateListingSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().min(10).optional(),
    campusId: zod_1.z.string().min(1).optional(),
    accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType).optional(),
    pricePerMonth: zod_1.z.number().positive().optional(),
    address: zod_1.z.string().min(3).optional(),
    totalRooms: zod_1.z.number().int().positive().optional(),
    availableRooms: zod_1.z.number().int().min(0).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    availabilityStatus: zod_1.z.nativeEnum(client_1.ListingAvailability).optional(),
})
    .refine((data) => {
    if (data.availableRooms !== undefined && data.totalRooms !== undefined) {
        return data.availableRooms <= data.totalRooms;
    }
    return true;
}, {
    message: 'Available rooms cannot exceed total rooms',
    path: ['availableRooms'],
});
exports.listingSearchQuerySchema = zod_1.z.object({
    institutionId: zod_1.z.string().optional(),
    campusId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    maxDistance: zod_1.z.coerce.number().positive().optional(),
    type: zod_1.z.nativeEnum(client_1.AccommodationType).optional(),
    availability: zod_1.z.nativeEnum(client_1.ListingAvailability).optional(),
    amenities: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    minRating: zod_1.z.coerce.number().min(1).max(5).optional(),
    sort: zod_1.z.enum(['price-asc', 'price-desc', 'nearest', 'highest-rated', 'newest']).optional().default('newest'),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(12),
});
