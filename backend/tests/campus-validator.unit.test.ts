import {
  createCampusSchema,
  institutionSchema,
  updateInstitutionSchema,
} from '../src/validators/campus.validator';

describe('campus institution/address validation', () => {
  it('requires an institution and full address', () => {
    const result = createCampusSchema.safeParse({
      name: 'Central Campus',
      location: 'Pretoria',
      address: 'University Road, Pretoria',
    });

    expect(result.success).toBe(false);
  });

  it('accepts institution-linked campus data without client coordinates', () => {
    const result = createCampusSchema.safeParse({
      institutionId: 'institution-1',
      name: 'Central Campus',
      location: 'Pretoria',
      address: 'University Road, Pretoria',
      latitude: -25.7,
      longitude: 28.2,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('latitude');
      expect(result.data).not.toHaveProperty('longitude');
    }
  });

  it('accepts an optional HTTP(S) institution logo URL', () => {
    expect(institutionSchema.safeParse({
      name: 'Example University',
      logoUrl: 'https://example.edu/logo.png',
    }).success).toBe(true);
    expect(institutionSchema.safeParse({
      name: 'Example University',
      logoUrl: null,
    }).success).toBe(true);
    expect(institutionSchema.safeParse({
      name: 'Example University',
      logoUrl: 'javascript:alert(1)',
    }).success).toBe(false);
  });

  it('allows an administrator to clear an institution logo URL', () => {
    expect(updateInstitutionSchema.safeParse({ logoUrl: null }).success).toBe(true);
    expect(updateInstitutionSchema.safeParse({ logoUrl: 'not a URL' }).success).toBe(false);
  });
});
