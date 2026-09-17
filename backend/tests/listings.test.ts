import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

describe('Sprint 2: Listings, Approval Workflow & Search Tests', () => {
  let adminToken = '';
  let verifiedLandlordToken = '';
  let campusId = '';
  let newListingId = '';

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@finder.co.za',
      password: 'AdminPass123!',
    });
    adminToken = adminRes.body.data.token;

    const landlordRes = await request(app).post('/api/auth/login').send({
      email: 'landlord@finder.co.za',
      password: 'LandlordPass123!',
    });
    verifiedLandlordToken = landlordRes.body.data.token;

    const campusRes = await request(app).get('/api/campuses');
    campusId = campusRes.body.data[0].id;
  });

  describe('Listing Creation Validation & Distance Calculation', () => {
    it('should reject listing with availableRooms > totalRooms (400)', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${verifiedLandlordToken}`)
        .send({
          title: 'Invalid Room Numbers',
          description: 'Available rooms cannot exceed total rooms.',
          campusId,
          accommodationType: 'APARTMENT',
          pricePerMonth: 5000,
          address: '10 Test Lane',
          latitude: -25.75,
          longitude: 28.23,
          totalRooms: 2,
          availableRooms: 5, // Invalid!
          amenities: ['WiFi'],
          photos: ['https://example.com/pic1.jpg'],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/available rooms/i);
    });

    it('should reject listing with negative price (400)', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${verifiedLandlordToken}`)
        .send({
          title: 'Negative Price Listing',
          description: 'Price must be strictly positive.',
          campusId,
          accommodationType: 'ROOM',
          pricePerMonth: -100, // Invalid!
          address: '10 Test Lane',
          latitude: -25.75,
          longitude: 28.23,
          totalRooms: 1,
          availableRooms: 1,
          amenities: ['WiFi'],
          photos: ['https://example.com/pic1.jpg'],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Verified landlord can create listing with multiple photos; distanceFromCampus is calculated and status is PENDING', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${verifiedLandlordToken}`)
        .send({
          title: 'Brooklyn Heights Student Cottage',
          description: 'Spacious cottage in Brooklyn, Pretoria with quiet study area and solar backup.',
          campusId,
          accommodationType: 'STUDIO',
          pricePerMonth: 4800,
          address: '320 Murray Street, Brooklyn, Pretoria',
          latitude: -25.7681,
          longitude: 28.2392,
          totalRooms: 2,
          availableRooms: 1,
          amenities: ['WiFi', 'Security', 'Solar Power', 'Parking'],
          photos: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('PENDING'); // Must be PENDING
      expect(res.body.data.distanceFromCampus).toBeDefined();
      expect(typeof res.body.data.distanceFromCampus).toBe('number');
      expect(res.body.data.distanceFromCampus).toBeGreaterThanOrEqual(0);
      expect(res.body.data.photos.length).toBe(2);

      newListingId = res.body.data.id;
    });
  });

  describe('Listing Approval Workflow & Public Visibility', () => {
    it('Pending listing MUST NOT appear in public GET /api/listings', async () => {
      const res = await request(app).get('/api/listings');
      expect(res.status).toBe(200);

      const found = res.body.data.items.find((item: any) => item.id === newListingId);
      expect(found).toBeUndefined(); // Strictly hidden until approved
    });

    it('Admin can view the pending listing in the approval queue', async () => {
      const res = await request(app)
        .get('/api/admin/listings/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.find((item: any) => item.id === newListingId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Brooklyn Heights Student Cottage');
    });

    it('Admin approves listing -> status becomes APPROVED and AuditLog is created', async () => {
      const res = await request(app)
        .patch(`/api/admin/listings/${newListingId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('APPROVED');

      // Verify Audit Log
      const audit = await prisma.auditLog.findFirst({
        where: { targetId: newListingId, action: 'APPROVE_LISTING' },
      });
      expect(audit).not.toBeNull();
    });

    it('Approved listing is NOW publicly visible in search', async () => {
      const res = await request(app).get('/api/listings');
      expect(res.status).toBe(200);

      const found = res.body.data.items.find((item: any) => item.id === newListingId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Brooklyn Heights Student Cottage');
    });

    it('Admin rejects listing with reason -> status becomes REJECTED and AuditLog created', async () => {
      const res = await request(app)
        .patch(`/api/admin/listings/${newListingId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Incomplete compliance documentation regarding fire safety.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe(
        'Incomplete compliance documentation regarding fire safety.'
      );

      // Now it must disappear from public search again
      const publicRes = await request(app).get('/api/listings');
      const found = publicRes.body.data.items.find((item: any) => item.id === newListingId);
      expect(found).toBeUndefined();
    });
  });

  describe('Student Search, Filters, Sorting & Pagination', () => {
    it('Filters by price range correctly', async () => {
      const res = await request(app).get('/api/listings?minPrice=3000&maxPrice=5000');
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      for (const item of res.body.data.items) {
        expect(item.pricePerMonth).toBeGreaterThanOrEqual(3000);
        expect(item.pricePerMonth).toBeLessThanOrEqual(5000);
      }
    });

    it('Sorts by price ascending', async () => {
      const res = await request(app).get('/api/listings?sort=price-asc');
      expect(res.status).toBe(200);
      const items = res.body.data.items;
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].pricePerMonth).toBeLessThanOrEqual(items[i + 1].pricePerMonth);
      }
    });

    it('Sorts by nearest distance from campus', async () => {
      const res = await request(app).get('/api/listings?sort=nearest');
      expect(res.status).toBe(200);
      const items = res.body.data.items;
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].distanceFromCampus).toBeLessThanOrEqual(items[i + 1].distanceFromCampus);
      }
    });

    it('Supports pagination with page, limit, and total count metadata', async () => {
      const res = await request(app).get('/api/listings?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(2);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });

    it('Provides full listing detail on GET /api/listings/:id', async () => {
      // Find one approved listing
      const listRes = await request(app).get('/api/listings');
      const sample = listRes.body.data.items[0];

      const detailRes = await request(app).get(`/api/listings/${sample.id}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.id).toBe(sample.id);
      expect(detailRes.body.data.campus).toBeDefined();
      expect(detailRes.body.data.photos).toBeDefined();
      expect(detailRes.body.data.owner).toBeDefined();
      expect(detailRes.body.data.owner.passwordHash).toBeUndefined();
    });
  });
});
