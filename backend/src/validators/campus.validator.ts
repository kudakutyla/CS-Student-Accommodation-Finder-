import { z } from 'zod';

export const createCampusSchema = z.object({
  name: z.string().min(2, 'Campus name must be at least 2 characters'),
  location: z.string().min(2, 'Location/City is required'),
  address: z.string().min(5, 'Address is required'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude coordinate'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude coordinate'),
  isActive: z.boolean().optional().default(true),
});

export const updateCampusSchema = createCampusSchema.partial();

export const toggleCampusStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status is required' }),
});

export type CreateCampusInput = z.infer<typeof createCampusSchema>;
export type UpdateCampusInput = z.infer<typeof updateCampusSchema>;
