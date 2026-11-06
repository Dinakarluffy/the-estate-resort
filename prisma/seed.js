const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Chikkamagaluru Coffee Estate Resort database...');

  // 1. Clean existing records
  await prisma.enquiry.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.blackoutDate.deleteMany({});
  await prisma.promoCode.deleteMany({});
  await prisma.rate.deleteMany({});
  await prisma.allotment.deleteMany({});
  await prisma.roomType.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Demo Users (Bcrypt hashed)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('demo1234', salt);

  const guest = await prisma.user.create({
    data: {
      email: 'guest@estate.com',
      passwordHash,
      name: 'Priya Sharma (Guest)',
      role: 'GUEST',
      phone: '+91 98765 43210',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@estate.com',
      passwordHash,
      name: 'Karthik Rao (Reservations)',
      role: 'STAFF',
      phone: '+91 98765 43211',
    },
  });

  const gm = await prisma.user.create({
    data: {
      email: 'gm@estate.com',
      passwordHash,
      name: 'Vikram Hegde (General Manager)',
      role: 'GM',
      phone: '+91 98765 43212',
    },
  });

  console.log('✅ Created demo users: guest@estate.com, staff@estate.com, gm@estate.com (password: demo1234)');

  // 3. Room Types (76 keys total: 64 rooms + 12 villas)
  const roomTypesData = [
    {
      name: "Planter's Heritage Room",
      slug: "planters-heritage-room",
      description: "Overlooking lush Arabica coffee bushes. Teakwood furnishings, private balcony, rain shower, and estate-sourced artisanal coffee station.",
      maxGuests: 2,
      basePrice: 6500, // <= ₹7,500/night -> 12% GST
      totalKeys: 32,
      defaultAllotment: 8,
      amenities: JSON.stringify(['King Bed', 'Coffee Balcony', 'Wi-Fi', 'Artisanal Coffee Bar', 'En-suite Bath']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      ]),
    },
    {
      name: "Coffee Estate Luxury Suite",
      slug: "coffee-estate-luxury-suite",
      description: "Spacious estate suite featuring panoramic views of the Mullayanagiri hills, fireplace, separate living lounge, and private courtyard.",
      maxGuests: 3,
      basePrice: 9500, // > ₹7,500/night -> 18% GST (Matches brief's average ₹9,500)
      totalKeys: 32,
      defaultAllotment: 6,
      amenities: JSON.stringify(['Panoramic Hill View', 'Living Lounge', 'Fireplace', 'Bathtub', 'High-Speed Wi-Fi', 'Breakfast Included']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      ]),
    },
    {
      name: "Misty Valley Pool Villa",
      slug: "misty-valley-pool-villa",
      description: "Private secluded villa amidst silver oak trees with a temperature-controlled plunge pool, sun deck, open-to-sky shower, and dedicated estate butler service.",
      maxGuests: 4,
      basePrice: 16000, // > ₹7,500/night -> 18% GST
      totalKeys: 12,
      defaultAllotment: 3,
      amenities: JSON.stringify(['Private Plunge Pool', 'Sun Deck', 'Butler Service', 'Open Sky Shower', 'Complimentary High Tea', 'All Meals Included']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      ]),
    },
  ];

  const createdRoomTypes = [];
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.create({ data: rt });
    createdRoomTypes.push(created);
  }
  console.log(`✅ Created ${createdRoomTypes.length} Room Types (total keys: 76)`);

  // 4. Seed Rates & Allotments for next 45 days
  const today = new Date();
  for (let i = 0; i < 45; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const isWeekend = targetDate.getDay() === 5 || targetDate.getDay() === 6; // Fri or Sat

    for (const rt of createdRoomTypes) {
      // Rates: Weekends are +20% higher
      const price = isWeekend ? Math.round(rt.basePrice * 1.2) : rt.basePrice;
      await prisma.rate.create({
        data: {
          roomTypeId: rt.id,
          date: dateStr,
          pricePerNight: price,
        },
      });

      // Website Allotment (e.g. 4 rooms for standard, 3 for suite, 2 for villa)
      await prisma.allotment.create({
        data: {
          roomTypeId: rt.id,
          date: dateStr,
          websiteAllotment: rt.defaultAllotment,
          bookedCount: 0,
        },
      });
    }
  }
  console.log('✅ Seeded 45 days of Rates & Website Allotments');

  // 5. Promo Code
  await prisma.promoCode.create({
    data: {
      code: 'COFFEE10',
      discountPercent: 10,
      maxDiscount: 2000,
      minTariff: 5000,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      maxUses: 500,
      currentUses: 0,
      isActive: true,
    },
  });
  console.log('✅ Seeded promo code: COFFEE10 (10% off up to ₹2,000)');

  // 6. Sample Enquiries (Mandatory sample data from problem statement!)
  const sampleEnquiries = [
    {
      enquiryNumber: 'ENQ-4410',
      source: 'EMAIL',
      rawMessage: "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights",
      guestName: 'Ananya Deshmukh',
      guestEmail: 'ananya.d@example.com',
      guestPhone: '+91 99887 76655',
      category: 'WEDDING',
      confidenceScore: 0.95,
      extractedDates: 'Feb 2027 (2 nights)',
      extractedGuests: 250,
      extractedBudget: 'Standard wedding package',
      assignedRole: 'STAFF',
      draftReply: `Dear Ananya,\n\nThank you for considering our coffee-estate resort for your sister's wedding in February 2027. Our sprawling amphitheater lawns and banquet spaces accommodate up to 350 guests comfortably, with 76 keys (villas and luxury suites) available for a complete estate buyout.\n\nOur wedding coordinator would love to arrange a private estate walkthrough and share our curated wedding brochure and culinary menu packages.\n\nWarm regards,\nSales & Events Team\nChikkamagaluru Estate Resort`,
      isAiGenerated: true,
      requiresGmReview: false,
      status: 'NEW',
    },
    {
      enquiryNumber: 'ENQ-4411',
      source: 'WHATSAPP',
      rawMessage: 'Is a villa free 14-16 Nov for 2 adults and a child?',
      guestName: 'Rohan Mehra',
      guestEmail: 'rohan.mehra@example.com',
      guestPhone: '+91 98112 23344',
      category: 'ROOM',
      confidenceScore: 0.96,
      extractedDates: '14-16 Nov 2026 (2 nights)',
      extractedGuests: 3,
      extractedBudget: null,
      assignedRole: 'STAFF',
      draftReply: `Dear Rohan,\n\nYes! Our Misty Valley Pool Villa is available for check-in on 14 Nov 2026 and check-out on 16 Nov 2026 (2 nights) for 2 adults and 1 child.\n\nThe direct-booking rate is ₹16,000/night + 18% GST (including complimentary estate breakfast and plantation tour). You can confirm your reservation directly on our website or reply to this message.\n\nWarm regards,\nReservations Team\nChikkamagaluru Estate Resort`,
      isAiGenerated: true,
      requiresGmReview: false,
      status: 'NEW',
    },
    {
      enquiryNumber: 'ENQ-4412',
      source: 'WEB',
      rawMessage: 'Team of 45 wants a January offsite with a conference hall',
      guestName: 'Suresh Menon (TechLead)',
      guestEmail: 'suresh.m@corpcorp.in',
      guestPhone: '+91 97401 23456',
      category: 'OFFSITE',
      confidenceScore: 0.92,
      extractedDates: 'January 2027',
      extractedGuests: 45,
      extractedBudget: null,
      assignedRole: 'STAFF',
      draftReply: `Dear Suresh,\n\nThank you for reaching out! We regularly host executive leadership offsites. Our 'Bean & Board' conference hall accommodates up to 60 attendees with 4K projection, high-speed leased-line internet, breakout gazebos amidst the coffee trails, and customized team-building plantation treks.\n\nCould you let us know your preferred dates in January so we can reserve a block of rooms and send our corporate offsite deck?\n\nWarm regards,\nCorporate Events Desk\nChikkamagaluru Estate Resort`,
      isAiGenerated: true,
      requiresGmReview: false,
      status: 'NEW',
    },
    {
      enquiryNumber: 'ENQ-4413',
      source: 'WHATSAPP',
      rawMessage: 'URGENT: Hot water in villa 4 has stopped working completely and the front desk intercom is not answering for the last 30 minutes!!',
      guestName: 'Dr. Aruna Rao',
      guestPhone: '+91 94481 99887',
      category: 'COMPLAINT',
      confidenceScore: 0.98,
      extractedDates: 'Immediate / In-house',
      extractedGuests: null,
      extractedBudget: null,
      assignedRole: 'GM',
      draftReply: `Dear Dr. Rao,\n\nWe sincerely apologize for this distressing experience. Our duty engineer and housekeeping supervisor have been dispatched to Villa 4 immediately with top priority to inspect the water heater and restore service.\n\nOur General Manager, Vikram Hegde, has been personally alerted to this matter and will visit you shortly.\n\nWarm regards,\nDuty Manager`,
      isAiGenerated: true,
      requiresGmReview: true, // Complaints ALWAYS alert GM!
      status: 'NEW',
    },
    {
      enquiryNumber: 'ENQ-4414',
      source: 'WEB',
      rawMessage: 'Can you tell me details?',
      guestName: 'Anonymous Visitor',
      guestEmail: 'visitor@unknown.com',
      category: 'UNSORTED',
      confidenceScore: 0.35, // Low confidence (< 0.7) -> Unsorted Lane!
      extractedDates: null,
      extractedGuests: null,
      extractedBudget: null,
      assignedRole: 'GM',
      draftReply: `Dear Guest,\n\nThank you for contacting our resort. Could you please specify your preferred dates of stay, number of guests, or whether you are inquiring about a leisure holiday, wedding, or corporate event? We will be delighted to assist you.\n\nWarm regards,\nReservations Team`,
      isAiGenerated: true,
      requiresGmReview: true, // Low confidence goes to GM unsorted lane!
      status: 'NEW',
    },
  ];

  for (const enq of sampleEnquiries) {
    await prisma.enquiry.create({ data: enq });
  }
  console.log(`✅ Seeded ${sampleEnquiries.length} sample enquiries (including ENQ-4410, 4411, 4412, Complaint, and Low-Confidence Unsorted)`);

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
