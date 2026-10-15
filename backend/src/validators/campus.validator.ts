import { z } from 'zod';

export const createCampusSchema = z.object({
  name: z.string().min(2, 'Campus name must be at least 2 characters'),
  institutionId: z.string().min(1, 'Institution is required'),
  location: z.string().min(2, 'Location/City is required'),
  address: z.string().min(5, 'Address is required'),
  isActive: z.boolean().optional().default(true),
});

export const updateCampusSchema = createCampusSchema.partial();

export const institutionSchema = z.object({
  name: z.string().min(2).max(160),
  shortName: z.string().max(40).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateInstitutionSchema = institutionSchema.partial();

export const toggleCampusStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status is required' }),
});

export type CreateCampusInput = z.infer<typeof createCampusSchema>;
export type UpdateCampusInput = z.infer<typeof updateCampusSchema>;
