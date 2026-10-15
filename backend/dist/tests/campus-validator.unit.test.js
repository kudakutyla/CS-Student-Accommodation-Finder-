"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const campus_validator_1 = require("../src/validators/campus.validator");
describe('campus institution/address validation', () => {
    it('requires an institution and full address', () => {
        const result = campus_validator_1.createCampusSchema.safeParse({
            name: 'Central Campus',
            location: 'Pretoria',
            address: 'University Road, Pretoria',
        });
        expect(result.success).toBe(false);
    });
    it('accepts institution-linked campus data without client coordinates', () => {
        const result = campus_validator_1.createCampusSchema.safeParse({
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
});
