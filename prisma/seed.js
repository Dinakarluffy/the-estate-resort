const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Chikkamagaluru Coffee Estate Resort database (Phase 6 Master Seed)...');

  // 1. Clean existing records in referential integrity order
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

  // Core Demo Accounts (Reviewed by IsoCode)
  const guestUser = await prisma.user.create({
    data: {
      email: 'guest@estate.com',
      passwordHash,
      name: 'Priya Sharma (Guest)',
      role: 'GUEST',
      phone: '+91 98765 43210',
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@estate.com',
      passwordHash,
      name: 'Karthik Rao (Reservations Staff)',
      role: 'STAFF',
      phone: '+91 98765 43211',
    },
  });

  const gmUser = await prisma.user.create({
    data: {
      email: 'gm@estate.com',
      passwordHash,
      name: 'Vikram Hegde (General Manager)',
      role: 'GM',
      phone: '+91 98765 43212',
    },
  });

  // Additional Realistic Dummy Users for Admin Testing
  const dummyUsers = [
    {
      name: 'Arun Patel',
      email: 'arun.patel@example.com',
      role: 'GUEST',
      phone: '+91 98200 11223',
    },
    {
      name: 'Deepa Nair',
      email: 'deepa.nair@example.com',
      role: 'GUEST',
      phone: '+91 98450 33445',
    },
    {
      name: 'Manish Joshi',
      email: 'manish.joshi@corpcorp.in',
      role: 'GUEST',
      phone: '+91 97110 55667',
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@weddings.in',
      role: 'GUEST',
      phone: '+91 99000 77889',
    },
    {
      name: 'Meera Sen (Front Desk)',
      email: 'meera.sen@estate.com',
      role: 'STAFF',
      phone: '+91 98765 43213',
    },
    {
      name: 'Rahul Verma (Duty Supervisor)',
      email: 'rahul.verma@estate.com',
      role: 'STAFF',
      phone: '+91 98765 43214',
    },
    {
      name: 'Anand Murthy (Operations Director)',
      email: 'anand.murthy@estate.com',
      role: 'GM',
      phone: '+91 98765 43215',
    },
  ];

  const createdDummyUsers = [];
  for (const u of dummyUsers) {
    const created = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        phone: u.phone,
      },
    });
    createdDummyUsers.push(created);
  }

  console.log(`✅ Seeded ${3 + dummyUsers.length} users with diverse roles (GUEST, STAFF, GM) - default password: demo1234`);

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
        '/images/rooms/heritage-1.jpg',
        '/images/rooms/heritage-2.jpg',
        '/images/rooms/heritage-3.jpg',
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
        '/images/rooms/suite-1.jpg',
        '/images/rooms/suite-2.jpg',
        '/images/rooms/suite-3.jpg',
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
        '/images/rooms/villa-1.jpg',
        '/images/rooms/villa-2.jpg',
        '/images/rooms/villa-3.jpg',
      ]),
    },
  ];

  const createdRoomTypes = [];
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.create({ data: rt });
    createdRoomTypes.push(created);
  }
  console.log(`✅ Created ${createdRoomTypes.length} Room Types (total keys: 76)`);

  const heritageRoom = createdRoomTypes.find((r) => r.slug === "planters-heritage-room");
  const luxurySuite = createdRoomTypes.find((r) => r.slug === "coffee-estate-luxury-suite");
  const poolVilla = createdRoomTypes.find((r) => r.slug === "misty-valley-pool-villa");

  // 4. Seed Rates & Allotments for rolling 45 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We will also seed dates starting from 5 days in the past up to 45 days ahead
  for (let i = -5; i < 45; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const isWeekend = targetDate.getDay() === 5 || targetDate.getDay() === 6;

    for (const rt of createdRoomTypes) {
      const price = isWeekend ? Math.round(rt.basePrice * 1.2) : rt.basePrice;
      await prisma.rate.create({
        data: {
          roomTypeId: rt.id,
          date: dateStr,
          pricePerNight: price,
        },
      });

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
  console.log('✅ Seeded 50 days of dynamic Rates (weekday/weekend surcharges) & Website Allotments');

  // 5. Seed Blackout Dates
  const poolVillaMaintenanceDate = new Date(today);
  poolVillaMaintenanceDate.setDate(today.getDate() + 7);
  const poolVillaMaintStr = poolVillaMaintenanceDate.toISOString().split('T')[0];

  const resortBuyoutDate = new Date(today);
  resortBuyoutDate.setDate(today.getDate() + 14);
  const resortBuyoutStr = resortBuyoutDate.toISOString().split('T')[0];

  await prisma.blackoutDate.create({
    data: {
      roomTypeId: poolVilla.id,
      date: poolVillaMaintStr,
      reason: 'Annual Private Pool & Filtration Deep-Clean Maintenance',
    },
  });

  await prisma.blackoutDate.create({
    data: {
      roomTypeId: null, // Resort-wide
      date: resortBuyoutStr,
      reason: 'Exclusive Destination Wedding Estate Buyout (All 76 Keys Reserved)',
    },
  });
  console.log(`✅ Seeded Blackout Dates: Room-Specific (${poolVillaMaintStr}) & Resort-Wide (${resortBuyoutStr})`);

  // 6. Seed Promotional Codes
  await prisma.promoCode.create({
    data: {
      code: 'COFFEE10',
      discountPercent: 10,
      maxDiscount: 2000,
      minTariff: 5000,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      maxUses: 500,
      currentUses: 3,
      isActive: true,
    },
  });

  await prisma.promoCode.create({
    data: {
      code: 'MONSOON15',
      discountPercent: 15,
      maxDiscount: 3500,
      minTariff: 8000,
      validFrom: '2026-06-01',
      validTo: '2026-12-31',
      maxUses: 200,
      currentUses: 0,
      isActive: true,
    },
  });

  await prisma.promoCode.create({
    data: {
      code: 'EXPIRED50',
      discountPercent: 50,
      maxDiscount: 5000,
      minTariff: 10000,
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
      maxUses: 50,
      currentUses: 50,
      isActive: false,
    },
  });
  console.log('✅ Seeded Promo Codes: COFFEE10 (Active, Capped), MONSOON15 (Active), and EXPIRED50 (Expired)');

  // 7. Seed Realistic Operational Bookings Across Lifecycle Stages
  const fmtDate = (daysFromToday) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysFromToday);
    return d.toISOString().split('T')[0];
  };

  const todayStr = fmtDate(0);
  const yesterdayStr = fmtDate(-1);
  const tomorrowStr = fmtDate(1);
  const day2Str = fmtDate(2);
  const day3Str = fmtDate(3);
  const day5Str = fmtDate(5);
  const day7Str = fmtDate(7);
  const pastCheckInStr = fmtDate(-5);
  const pastCheckOutStr = fmtDate(-3);

  const seededBookings = [
    // 1. In-House Guest (Currently Staying) -> Priya Sharma (guest@estate.com)
    // Allows guest to test "Extend Stay" on /my-bookings & shows as "In-House" at /staff/bookings
    {
      bookingNumber: 'EST-2026-8101',
      userId: guestUser.id,
      guestName: guestUser.name,
      guestEmail: guestUser.email,
      guestPhone: guestUser.phone,
      roomTypeId: luxurySuite.id,
      checkIn: yesterdayStr,
      checkOut: tomorrowStr,
      totalNights: 2,
      baseTariffTotal: 19000, // ₹9,500 x 2
      discountAmount: 1900,   // 10% promo
      netTaxableAmount: 17100,
      gstRatePercent: 18,     // > ₹7,500/night -> 18%
      gstAmount: 3078,
      grandTotal: 20178,
      status: 'CHECKED_IN',
      paymentStatus: 'PAID',
      paymentReference: 'RAZORPAY_TEST_8101',
      promoCode: 'COFFEE10',
    },

    // 2. Arriving Today (Today's Arrivals) -> Arun Patel
    // Shows in Front Desk ribbon as "Today's Arrivals (1)" with 1-click "Check In" button ready
    {
      bookingNumber: 'EST-2026-8102',
      userId: createdDummyUsers[0].id,
      guestName: 'Arun Patel',
      guestEmail: 'arun.patel@example.com',
      guestPhone: '+91 98200 11223',
      roomTypeId: heritageRoom.id,
      checkIn: todayStr,
      checkOut: day2Str,
      totalNights: 2,
      baseTariffTotal: 13000, // ₹6,500 x 2
      discountAmount: 0,
      netTaxableAmount: 13000,
      gstRatePercent: 12,     // <= ₹7,500/night -> 12%
      gstAmount: 1560,
      grandTotal: 14560,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentReference: 'RAZORPAY_TEST_8102',
      promoCode: null,
    },

    // 3. Departing Today (Today's Departures) -> Deepa Nair
    // Shows in Front Desk ribbon as "Today's Departures (1)" with 1-click "Check Out" button ready
    {
      bookingNumber: 'EST-2026-8103',
      userId: createdDummyUsers[1].id,
      guestName: 'Deepa Nair',
      guestEmail: 'deepa.nair@example.com',
      guestPhone: '+91 98450 33445',
      roomTypeId: poolVilla.id,
      checkIn: yesterdayStr,
      checkOut: todayStr,
      totalNights: 1,
      baseTariffTotal: 16000, // ₹16,000 x 1
      discountAmount: 1600,
      netTaxableAmount: 14400,
      gstRatePercent: 18,     // > ₹7,500/night -> 18%
      gstAmount: 2592,
      grandTotal: 16992,
      status: 'CHECKED_IN',
      paymentStatus: 'PAID',
      paymentReference: 'RAZORPAY_TEST_8103',
      promoCode: 'COFFEE10',
    },

    // 4. Future Confirmed Booking -> Priya Sharma (guest@estate.com)
    // Allows Priya to test "48-Hour Free Cancellation" with instant allotment rollback
    {
      bookingNumber: 'EST-2026-8104',
      userId: guestUser.id,
      guestName: guestUser.name,
      guestEmail: guestUser.email,
      guestPhone: guestUser.phone,
      roomTypeId: heritageRoom.id,
      checkIn: day5Str,
      checkOut: day7Str,
      totalNights: 2,
      baseTariffTotal: 13000,
      discountAmount: 0,
      netTaxableAmount: 13000,
      gstRatePercent: 12,
      gstAmount: 1560,
      grandTotal: 14560,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentReference: 'RAZORPAY_TEST_8104',
      promoCode: null,
    },

    // 5. Cancelled Stay (Refunded) -> Manish Joshi
    // Demonstrates cancellation audit trail and front desk PMS export formatting
    {
      bookingNumber: 'EST-2026-8105',
      userId: createdDummyUsers[2].id,
      guestName: 'Manish Joshi',
      guestEmail: 'manish.joshi@corpcorp.in',
      guestPhone: '+91 97110 55667',
      roomTypeId: luxurySuite.id,
      checkIn: day3Str,
      checkOut: day5Str,
      totalNights: 2,
      baseTariffTotal: 19000,
      discountAmount: 0,
      netTaxableAmount: 19000,
      gstRatePercent: 18,
      gstAmount: 3420,
      grandTotal: 22420,
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      paymentReference: 'RAZORPAY_REFUND_8105',
      promoCode: null,
    },

    // 6. Completed Past Stay -> Priya Sharma (guest@estate.com)
    // Demonstrates guest stay history with action modification locks (tax invoice only)
    {
      bookingNumber: 'EST-2026-8106',
      userId: guestUser.id,
      guestName: guestUser.name,
      guestEmail: guestUser.email,
      guestPhone: guestUser.phone,
      roomTypeId: heritageRoom.id,
      checkIn: pastCheckInStr,
      checkOut: pastCheckOutStr,
      totalNights: 2,
      baseTariffTotal: 13000,
      discountAmount: 1300,
      netTaxableAmount: 11700,
      gstRatePercent: 12,
      gstAmount: 1404,
      grandTotal: 13104,
      status: 'CHECKED_OUT',
      paymentStatus: 'PAID',
      paymentReference: 'RAZORPAY_TEST_8106',
      promoCode: 'COFFEE10',
    },
  ];

  for (const b of seededBookings) {
    await prisma.booking.create({ data: b });

    // For active/in-house bookings, accurately increment allotment bookedCount
    if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') {
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        await prisma.allotment.updateMany({
          where: {
            roomTypeId: b.roomTypeId,
            date: dStr,
          },
          data: {
            bookedCount: { increment: 1 },
          },
        });
      }
    }
  }
  console.log(`✅ Seeded ${seededBookings.length} realistic bookings covering all lifecycle stages (CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)`);

  // 8. Sample Enquiries
  const sampleEnquiries = [
    {
      enquiryNumber: 'ENQ-4410',
      source: 'EMAIL',
      rawMessage: "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights",
      guestName: 'Ananya Deshmukh',
      guestEmail: 'ananya.d@example.com',
      guestPhone: null,
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
      guestPhone: null,
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
      guestPhone: null,
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
      guestPhone: null,
      category: 'COMPLAINT',
      confidenceScore: 0.98,
      extractedDates: 'Immediate / In-house',
      extractedGuests: null,
      extractedBudget: null,
      assignedRole: 'GM',
      draftReply: `Dear Dr. Rao,\n\nWe sincerely apologize for this distressing experience. Our duty engineer and housekeeping supervisor have been dispatched to Villa 4 immediately with top priority to inspect the water heater and restore service.\n\nOur General Manager, Vikram Hegde, has been personally alerted to this matter and will visit you shortly.\n\nWarm regards,\nDuty Manager`,
      isAiGenerated: true,
      requiresGmReview: true,
      status: 'NEW',
    },
    {
      enquiryNumber: 'ENQ-4414',
      source: 'WEB',
      rawMessage: 'Can you tell me details?',
      guestName: 'Anonymous Visitor',
      guestEmail: 'visitor@unknown.com',
      guestPhone: null,
      category: 'UNSORTED',
      confidenceScore: 0.35,
      extractedDates: null,
      extractedGuests: null,
      extractedBudget: null,
      assignedRole: 'GM',
      draftReply: `Dear Guest,\n\nThank you for contacting our resort. Could you please specify your preferred dates of stay, number of guests, or whether you are inquiring about a leisure holiday, wedding, or corporate event? We will be delighted to assist you.\n\nWarm regards,\nReservations Team`,
      isAiGenerated: true,
      requiresGmReview: true,
      status: 'NEW',
    },
  ];

  for (const enq of sampleEnquiries) {
    await prisma.enquiry.create({ data: enq });
  }
  console.log(`✅ Seeded ${sampleEnquiries.length} benchmark sample enquiries`);

  console.log('🎉 Database seeding complete! System is 100% primed for full end-to-end evaluation.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
