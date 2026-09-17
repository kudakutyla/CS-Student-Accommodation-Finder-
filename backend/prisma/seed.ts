import { PrismaClient, UserRole, AccommodationType, ListingApprovalStatus, ListingAvailability } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Haversine formula
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

async function main() {
  console.log('--- Starting Student Accommodation Finder Database Seeding ---');

  // Clean existing data in relational order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.favourite.deleteMany({});
  await prisma.listingPhoto.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.campus.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing records.');

  // 1. Create Campuses
  const campusesData = [
    {
      name: 'TUT Soshanguve Campus',
      location: 'Pretoria, Gauteng',
      address: '2 Aubrey Matlala Rd, Soshanguve, Pretoria, 0152',
      latitude: -25.5401,
      longitude: 28.0967,
      isActive: true,
    },
    {
      name: 'TUT Pretoria Campus',
      location: 'Pretoria, Gauteng',
      address: 'Staatsartillerie Rd, Pretoria West, Pretoria, 0183',
      latitude: -25.7323,
      longitude: 28.1624,
      isActive: true,
    },
    {
      name: 'University of Pretoria (Hatfield)',
      location: 'Pretoria, Gauteng',
      address: 'Lynnwood Rd, Hatfield, Pretoria, 0002',
      latitude: -25.7545,
      longitude: 28.2314,
      isActive: true,
    },
    {
      name: 'University of the Witwatersrand',
      location: 'Johannesburg, Gauteng',
      address: '1 Jan Smuts Ave, Braamfontein, Johannesburg, 2000',
      latitude: -26.1929,
      longitude: 28.0305,
      isActive: true,
    },
    {
      name: 'University of Cape Town',
      location: 'Cape Town, Western Cape',
      address: 'Rondebosch, Cape Town, 7700',
      latitude: -33.9577,
      longitude: 18.4612,
      isActive: true,
    },
  ];

  const createdCampuses: Record<string, any> = {};
  for (const c of campusesData) {
    const campus = await prisma.campus.create({ data: c });
    createdCampuses[c.name] = campus;
    console.log(`Created Campus: ${campus.name}`);
  }

  // 2. Create Users with hashed passwords
  const adminPassword = await bcrypt.hash('AdminPass123!', 10);
  const landlordPassword = await bcrypt.hash('LandlordPass123!', 10);
  const studentPassword = await bcrypt.hash('StudentPass123!', 10);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@finder.co.za',
      passwordHash: adminPassword,
      phone: '+27 12 345 6789',
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Created Admin: ${admin.email}`);

  // Verified Landlord 1 (Thabo Molefe)
  const verifiedLandlord1 = await prisma.user.create({
    data: {
      name: 'Thabo Molefe Properties',
      email: 'landlord@finder.co.za',
      passwordHash: landlordPassword,
      phone: '+27 82 123 4567',
      role: UserRole.LANDLORD,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Created Verified Landlord: ${verifiedLandlord1.email}`);

  // Verified Landlord 2 (Nomvula Dlamini)
  const verifiedLandlord2 = await prisma.user.create({
    data: {
      name: 'Nomvula Housing Solutions',
      email: 'nomvula@finder.co.za',
      passwordHash: landlordPassword,
      phone: '+27 84 345 6789',
      role: UserRole.LANDLORD,
      isVerified: true,
      isActive: true,
    },
  });

  // Unverified Landlord
  const unverifiedLandlord = await prisma.user.create({
    data: {
      name: 'Christo van Wyk',
      email: 'unverified@finder.co.za',
      passwordHash: landlordPassword,
      phone: '+27 83 234 5678',
      role: UserRole.LANDLORD,
      isVerified: false,
      isActive: true,
    },
  });
  console.log(`Created Unverified Landlord: ${unverifiedLandlord.email}`);

  // Students
  const student1 = await prisma.user.create({
    data: {
      name: 'Kudakwashe Chifamba',
      email: 'student@finder.co.za',
      passwordHash: studentPassword,
      phone: '+27 71 987 6543',
      role: UserRole.STUDENT,
      isVerified: true,
      isActive: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Lerato Mokoena',
      email: 'lerato@finder.co.za',
      passwordHash: studentPassword,
      phone: '+27 72 876 5432',
      role: UserRole.STUDENT,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Created Students: ${student1.email}, ${student2.email}`);

  // 3. Create Sample Listings
  const listingsToCreate = [
    {
      title: 'Rosebank Modern Garden Flat',
      description:
        'Bright and spacious garden flat with private entrance, fully furnished with contemporary appliances. Walking distance to Wits campus and Gautrain station. Features 24-hour security complex, fast uncapped fibre, and secure covered parking.',
      accommodationType: AccommodationType.BACHELOR,
      pricePerMonth: 6800,
      address: '14 Oxford Road, Rosebank, Johannesburg',
      latitude: -26.1465,
      longitude: 28.0418,
      campusKey: 'University of the Witwatersrand',
      totalRooms: 3,
      availableRooms: 1,
      amenities: ['WiFi', 'Security', 'Parking', 'Laundry', 'Fibre', 'CCTV'],
      availabilityStatus: ListingAvailability.AVAILABLE,
      approvalStatus: ListingApprovalStatus.APPROVED,
      ownerId: verifiedLandlord1.id,
      photos: [
        'https://images.unsplash.com/photo-1628592102751-ba83b0314276?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [
        {
          userId: student1.id,
          rating: 5,
          comment: 'Beautiful flat in a very secure complex. Landlord is responsive and honest. Highly recommend!',
        },
        {
          userId: student2.id,
          rating: 4,
          comment: 'Great location near public transport. A bit pricey but the quality and security justify it.',
        },
      ],
    },
    {
      title: 'Observatory Communal Student House',
      description:
        'Spacious, friendly communal student house in the vibrant heart of Observatory. Furnished rooms with private desks, shared high-spec kitchen, open living areas, and sunny braai courtyard. Near UCT Jammie Shuttle stop and Groote Schuur.',
      accommodationType: AccommodationType.SHARED_HOUSE,
      pricePerMonth: 4200,
      address: '42 Trill Road, Observatory, Cape Town',
      latitude: -33.9372,
      longitude: 18.4715,
      campusKey: 'University of Cape Town',
      totalRooms: 5,
      availableRooms: 2,
      amenities: ['WiFi', 'Fibre', 'Braai Area', 'DSTV', 'Furnished', 'Garden'],
      availabilityStatus: ListingAvailability.LIMITED,
      approvalStatus: ListingApprovalStatus.APPROVED,
      ownerId: verifiedLandlord2.id,
      photos: [
        'https://images.unsplash.com/photo-1663756915304-40b7eda63e41?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [
        {
          userId: student2.id,
          rating: 5,
          comment: 'Loved living here! Nomvula is an exceptional host who handles repairs promptly.',
        },
      ],
    },
    {
      title: 'Hatfield Luxury Student Residence',
      description:
        'Purpose-built premium student residence directly adjacent to UP Hatfield main campus. All inclusive option available. Study facilities with backup power (no load-shedding), on-site gym, biometric 24/7 security, and social lounge.',
      accommodationType: AccommodationType.STUDENT_RESIDENCE,
      pricePerMonth: 5500,
      address: '1120 Burnett Street, Hatfield, Pretoria',
      latitude: -25.7512,
      longitude: 28.2378,
      campusKey: 'University of Pretoria (Hatfield)',
      totalRooms: 12,
      availableRooms: 4,
      amenities: ['WiFi', 'Security', 'Gym', 'Study Room', 'Backup Generator', 'Biometrics'],
      availabilityStatus: ListingAvailability.AVAILABLE,
      approvalStatus: ListingApprovalStatus.APPROVED,
      ownerId: verifiedLandlord1.id,
      photos: [
        'https://images.unsplash.com/photo-1541194577687-8c63bf9e7ee3?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [
        {
          userId: student1.id,
          rating: 4,
          comment: 'Outstanding study rooms and uninterrupted power during exams. Great social vibe.',
        },
      ],
    },
    {
      title: 'Soshanguve Student Haven Apartments',
      description:
        'Comfortable and secure apartment complex tailored for TUT Soshanguve students. Within quick walking distance to campus gates. Gated perimeter with 24/7 guard, borehole water backup, and prepaid electricity.',
      accommodationType: AccommodationType.APARTMENT,
      pricePerMonth: 3200,
      address: '88 Aubrey Matlala Road, Soshanguve, Pretoria',
      latitude: -25.5432,
      longitude: 28.0934,
      campusKey: 'TUT Soshanguve Campus',
      totalRooms: 4,
      availableRooms: 2,
      amenities: ['WiFi', 'Security', 'Water Tank', 'Study Desk', 'Prepaid Electricity'],
      availabilityStatus: ListingAvailability.AVAILABLE,
      approvalStatus: ListingApprovalStatus.APPROVED,
      ownerId: verifiedLandlord1.id,
      photos: [
        'https://images.unsplash.com/photo-1579632151052-92f741fb9b79?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [],
    },
    {
      title: 'Pretoria West Bachelor Studio',
      description:
        'Self-contained bachelor flat located minutes away from TUT Pretoria Campus. Complete with private kitchenette, en-suite bathroom, and secure off-street parking. Ideal for dedicated students seeking a quiet study haven.',
      accommodationType: AccommodationType.BACHELOR,
      pricePerMonth: 3800,
      address: '240 Vom Hagen Street, Pretoria West, Pretoria',
      latitude: -25.7356,
      longitude: 28.1678,
      campusKey: 'TUT Pretoria Campus',
      totalRooms: 2,
      availableRooms: 1,
      amenities: ['WiFi', 'Parking', 'Security', 'Kitchenette', 'Private Bathroom'],
      availabilityStatus: ListingAvailability.AVAILABLE,
      approvalStatus: ListingApprovalStatus.APPROVED,
      ownerId: verifiedLandlord2.id,
      photos: [
        'https://images.unsplash.com/photo-1502005229762-ee1b2b814421?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [],
    },
    {
      title: 'Braamfontein Designer Loft',
      description:
        'Urban loft apartment steps from Wits main entrance. Industrial chic finishes, rooftop leisure deck, 24-hour security with concierge, fast uncapped fibre, and study lounges.',
      accommodationType: AccommodationType.APARTMENT,
      pricePerMonth: 7500,
      address: '68 Juta Street, Braamfontein, Johannesburg',
      latitude: -26.1951,
      longitude: 28.0342,
      campusKey: 'University of the Witwatersrand',
      totalRooms: 2,
      availableRooms: 1,
      amenities: ['Fibre', 'Security', 'Rooftop', 'Gym', 'Concierge', 'Biometrics'],
      availabilityStatus: ListingAvailability.LIMITED,
      approvalStatus: ListingApprovalStatus.APPROVED,
      ownerId: verifiedLandlord1.id,
      photos: [
        'https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [
        {
          userId: student1.id,
          rating: 5,
          comment: 'Perfect location for Wits engineering students. Close to everything in Braam.',
        },
      ],
    },
    // Pending Listing (for testing Admin Approval Workflow)
    {
      title: 'Melville Trendy Student Townhouse',
      description:
        'Spacious, renovated townhouse in fashionable Melville. Features 3 bedrooms, shared garden, fast WiFi, and private study corners. Awaiting administrative review.',
      accommodationType: AccommodationType.TOWNHOUSE,
      pricePerMonth: 8900,
      address: '15 4th Avenue, Melville, Johannesburg',
      latitude: -26.1782,
      longitude: 28.0051,
      campusKey: 'University of the Witwatersrand',
      totalRooms: 3,
      availableRooms: 3,
      amenities: ['WiFi', 'Parking', 'Security', 'Garden'],
      availabilityStatus: ListingAvailability.AVAILABLE,
      approvalStatus: ListingApprovalStatus.PENDING,
      ownerId: verifiedLandlord1.id,
      photos: [
        'https://images.unsplash.com/photo-1738168279272-c08d6dd22002?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [],
    },
    // Rejected Listing (for testing Negative Visibility)
    {
      title: 'Auckland Park Low-Cost Room',
      description:
        'Incomplete listing with non-compliant photos.',
      accommodationType: AccommodationType.ROOM,
      pricePerMonth: 2500,
      address: '50 Kingsway Avenue, Auckland Park, Johannesburg',
      latitude: -26.1852,
      longitude: 28.0014,
      campusKey: 'University of the Witwatersrand',
      totalRooms: 1,
      availableRooms: 0,
      amenities: ['WiFi'],
      availabilityStatus: ListingAvailability.UNAVAILABLE,
      approvalStatus: ListingApprovalStatus.REJECTED,
      rejectionReason: 'Listing photos do not accurately reflect property condition or adhere to safety guidelines.',
      ownerId: verifiedLandlord1.id,
      photos: [
        'https://images.unsplash.com/photo-1541194577687-8c63bf9e7ee3?w=800&h=600&fit=crop&auto=format',
      ],
      reviews: [],
    },
  ];

  for (const item of listingsToCreate) {
    const campus = createdCampuses[item.campusKey];
    if (!campus) continue;

    const distanceFromCampus = calculateHaversineDistance(
      item.latitude,
      item.longitude,
      campus.latitude,
      campus.longitude
    );

    const listing = await prisma.listing.create({
      data: {
        title: item.title,
        description: item.description,
        accommodationType: item.accommodationType,
        pricePerMonth: item.pricePerMonth,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        distanceFromCampus,
        totalRooms: item.totalRooms,
        availableRooms: item.availableRooms,
        amenities: item.amenities,
        availabilityStatus: item.availabilityStatus,
        approvalStatus: item.approvalStatus,
        rejectionReason: (item as any).rejectionReason || null,
        ownerId: item.ownerId,
        campusId: campus.id,
        photos: {
          create: item.photos.map((url, idx) => ({
            photoUrl: url,
            isPrimary: idx === 0,
          })),
        },
      },
    });

    // Add sample reviews if any
    for (const r of item.reviews) {
      await prisma.review.create({
        data: {
          listingId: listing.id,
          userId: r.userId,
          rating: r.rating,
          comment: r.comment,
        },
      });
    }

    console.log(`Created Listing: "${listing.title}" (Status: ${listing.approvalStatus}, Distance: ${distanceFromCampus} km)`);
  }

  // 4. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: 'SYSTEM_SEED',
      targetType: 'SYSTEM',
      targetId: 'SEED_INITIAL',
      description: 'System database initialized with South African development seed data.',
    },
  });

  console.log('--- Database Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
