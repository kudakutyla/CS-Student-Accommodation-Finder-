import { z } from 'zod';
import { AccommodationType, ListingAvailability } from '@prisma/client';

export const createListingSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    campusId: z.string().min(1, 'Campus is required'),
    accommodationType: z.nativeEnum(AccommodationType, {
      errorMap: () => ({ message: 'Valid accommodation type is required' }),
    }),
    pricePerMonth: z.number().positive('Monthly price must be greater than 0'),
    address: z.string().min(3, 'Address is required'),
    latitude: z.number().min(-90).max(90, 'Valid latitude coordinate is required'),
    longitude: z.number().min(-180).max(180, 'Valid longitude coordinate is required'),
    totalRooms: z.number().int().positive('Total rooms must be at least 1'),
    availableRooms: z.number().int().min(0, 'Available rooms cannot be negative'),
    amenities: z.array(z.string()).default([]),
    photos: z.array(z.string().url('Each photo must be a valid URL')).min(1, 'At least one photo URL is required'),
    availabilityStatus: z.nativeEnum(ListingAvailability).optional().default(ListingAvailability.AVAILABLE),
  })
  .refine((data) => data.availableRooms <= data.totalRooms, {
    message: 'Available rooms cannot exceed total rooms',
    path: ['availableRooms'],
  });

export const updateListingSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    campusId: z.string().min(1).optional(),
    accommodationType: z.nativeEnum(AccommodationType).optional(),
    pricePerMonth: z.number().positive().optional(),
    address: z.string().min(3).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    totalRooms: z.number().int().positive().optional(),
    availableRooms: z.number().int().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    photos: z.array(z.string().url()).min(1).optional(),
    availabilityStatus: z.nativeEnum(ListingAvailability).optional(),
  })
  .refine(
    (data) => {
      if (data.availableRooms !== undefined && data.totalRooms !== undefined) {
        return data.availableRooms <= data.totalRooms;
      }
      return true;
    },
    {
      message: 'Available rooms cannot exceed total rooms',
      path: ['availableRooms'],
    }
  );

export const listingSearchQuerySchema = z.object({
  campusId: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  maxDistance: z.coerce.number().positive().optional(),
  type: z.nativeEnum(AccommodationType).optional(),
  availability: z.nativeEnum(ListingAvailability).optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(['price-asc', 'price-desc', 'nearest', 'highest-rated', 'newest']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingSearchQuery = z.infer<typeof listingSearchQuerySchema>;
