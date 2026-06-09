import { db } from "./db";
import { categories, users, suppliers, supplierPromotions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SEED_SUPPLIERS = [
  {
    name: "BuildRight Supplies",
    email: "info@buildright.co.bw",
    phone: "71234567",
    companyName: "BuildRight Supplies (Pty) Ltd",
    physicalAddress: "Plot 4521, Industrial Area, Gaborone",
    contactPerson: "Thabo Mokoena",
    contactPosition: "Sales Manager",
    companyEmail: "info@buildright.co.bw",
    companyPhone: "71234567",
    industryType: "Building Materials",
    ratingAverage: "4.7",
    reviewCount: 38,
    featured: true,
    aboutUs: "Botswana's leading supplier of quality building materials since 2005.",
    specialOffer: "10% off all cement orders above 50 bags this month",
    promotions: [
      {
        title: "Winter Construction Sale",
        description: "Save big on roofing sheets, bricks and cement this winter season.",
        discountPercentage: 15,
        validFrom: new Date("2025-06-01"),
        validUntil: new Date("2025-08-31"),
        termsAndConditions: "Minimum order P5,000. Cannot be combined with other offers.",
      },
      {
        title: "Bulk Buyer Discount",
        description: "Order 100+ bags of cement and get free delivery anywhere in Gaborone.",
        discountPercentage: 10,
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2025-12-31"),
        termsAndConditions: "Delivery within 30km radius. Valid for trade accounts only.",
      },
    ],
  },
  {
    name: "PowerTech Electrical",
    email: "sales@powertech.co.bw",
    phone: "72345678",
    companyName: "PowerTech Electrical Wholesalers",
    physicalAddress: "Unit 3, Commerce Park, Gaborone",
    contactPerson: "Keabetswe Sithole",
    contactPosition: "Director",
    companyEmail: "sales@powertech.co.bw",
    companyPhone: "72345678",
    industryType: "Electrical",
    ratingAverage: "4.5",
    reviewCount: 24,
    featured: false,
    aboutUs: "Wholesale electrical supplies, wiring, fittings and smart home systems.",
    specialOffer: "Free delivery on orders over P2,000",
    promotions: [
      {
        title: "Smart Home Bundle",
        description: "Full smart switch kit including 4 outlets, hub, and installation guide.",
        discountPercentage: 20,
        validFrom: new Date("2025-05-01"),
        validUntil: new Date("2025-09-30"),
        termsAndConditions: "While stocks last. One bundle per customer.",
      },
    ],
  },
  {
    name: "FlowPipe Plumbing",
    email: "hello@flowpipe.co.bw",
    phone: "73456789",
    companyName: "FlowPipe Plumbing Supplies",
    physicalAddress: "Block 8, Broadhurst Industrial, Gaborone",
    contactPerson: "Mpho Dlamini",
    contactPosition: "Operations Manager",
    companyEmail: "hello@flowpipe.co.bw",
    companyPhone: "73456789",
    industryType: "Plumbing",
    ratingAverage: "4.3",
    reviewCount: 17,
    featured: false,
    aboutUs: "Complete plumbing supply solutions for contractors and homeowners.",
    specialOffer: null,
    promotions: [
      {
        title: "Geyser Clearance",
        description: "Selected 150L and 200L geysers at reduced prices. Limited stock.",
        discountPercentage: 25,
        validFrom: new Date("2025-07-01"),
        validUntil: new Date("2025-07-31"),
        termsAndConditions: "Stock subject to availability. No returns on clearance items.",
      },
    ],
  },
  {
    name: "WoodCraft Furniture",
    email: "orders@woodcraft.co.bw",
    phone: "74567890",
    companyName: "WoodCraft Furniture & Interiors",
    physicalAddress: "Showroom 5, Fairgrounds Mall, Gaborone",
    contactPerson: "Naledi Kgosi",
    contactPosition: "Showroom Manager",
    companyEmail: "orders@woodcraft.co.bw",
    companyPhone: "74567890",
    industryType: "Furniture",
    ratingAverage: "4.8",
    reviewCount: 51,
    featured: true,
    aboutUs: "Custom and ready-made furniture crafted from locally sourced hardwood.",
    specialOffer: "Free assembly on all bedroom sets",
    promotions: [
      {
        title: "Year-End Bedroom Blowout",
        description: "Complete bedroom sets (bed, wardrobe, 2 pedestals) at package prices.",
        discountPercentage: 18,
        validFrom: new Date("2025-11-01"),
        validUntil: new Date("2025-12-31"),
        termsAndConditions: "Free delivery within Gaborone. Assembly included.",
      },
      {
        title: "Custom Office Furniture",
        description: "Order custom desks and shelving units for your office at trade prices.",
        discountPercentage: 12,
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2025-12-31"),
        termsAndConditions: "Minimum order 3 units. Lead time 2–3 weeks.",
      },
    ],
  },
  {
    name: "ColorPro Paints",
    email: "info@colorpro.co.bw",
    phone: "75678901",
    companyName: "ColorPro Paints & Coatings",
    physicalAddress: "Shop 12, Molapo Crossing, Gaborone West",
    contactPerson: "Otsile Mmusi",
    contactPosition: "Branch Manager",
    companyEmail: "info@colorpro.co.bw",
    companyPhone: "75678901",
    industryType: "Paint & Coatings",
    ratingAverage: "4.2",
    reviewCount: 29,
    featured: false,
    aboutUs: "Full range of interior and exterior paints, primers and waterproof coatings.",
    specialOffer: "Buy 5 litres get 1 litre free on Dulux Weathershield",
    promotions: [
      {
        title: "Contractors Loyalty Programme",
        description: "Earn points on every purchase redeemable for free paint and brushes.",
        discountPercentage: null,
        validFrom: new Date("2025-01-01"),
        validUntil: new Date("2025-12-31"),
        termsAndConditions: "Register in store. Points expire after 12 months.",
      },
    ],
  },
  {
    name: "ToolMart Hardware",
    email: "toolmart@toolmart.co.bw",
    phone: "76789012",
    companyName: "ToolMart Hardware & Tools",
    physicalAddress: "Plot 1150, Western Bypass Industrial, Gaborone",
    contactPerson: "Gorata Seretse",
    contactPosition: "Procurement Lead",
    companyEmail: "toolmart@toolmart.co.bw",
    companyPhone: "76789012",
    industryType: "Tools & Equipment",
    ratingAverage: "4.6",
    reviewCount: 43,
    featured: true,
    aboutUs: "Power tools, hand tools, safety equipment and construction accessories.",
    specialOffer: "Hire equipment from as low as P150/day",
    promotions: [
      {
        title: "Power Tool Flash Sale",
        description: "Up to 30% off selected Bosch, DeWalt and Makita power tools.",
        discountPercentage: 30,
        validFrom: new Date("2025-08-01"),
        validUntil: new Date("2025-08-15"),
        termsAndConditions: "While stocks last. Online orders only.",
      },
      {
        title: "Safety Gear Package",
        description: "Hard hat, gloves, goggles and hi-vis vest bundled at one price.",
        discountPercentage: 22,
        validFrom: new Date("2025-06-01"),
        validUntil: new Date("2025-12-31"),
        termsAndConditions: "Bundle sold as-is. Sizes subject to availability.",
      },
    ],
  },
];

export async function seedSuppliers() {
  console.log("Seeding suppliers...");
  const passwordHash = await bcrypt.hash("Supplier123!", 8);
  let inserted = 0;

  for (const s of SEED_SUPPLIERS) {
    const existing = await db.select().from(users).where(eq(users.email, s.email)).limit(1);
    if (existing.length > 0) continue;

    const [user] = await db.insert(users).values({
      role: "supplier",
      name: s.name,
      email: s.email,
      phone: s.phone,
      passwordHash,
      isVerified: true,
      isEmailVerified: true,
    }).returning();

    await db.insert(suppliers).values({
      userId: user.id,
      companyName: s.companyName,
      physicalAddress: s.physicalAddress,
      contactPerson: s.contactPerson,
      contactPosition: s.contactPosition,
      companyEmail: s.companyEmail,
      companyPhone: s.companyPhone,
      industryType: s.industryType,
      ratingAverage: s.ratingAverage,
      reviewCount: s.reviewCount,
      featured: s.featured,
      aboutUs: s.aboutUs,
      specialOffer: s.specialOffer ?? null,
    });

    for (const promo of s.promotions) {
      await db.insert(supplierPromotions).values({
        supplierId: user.id,
        title: promo.title,
        description: promo.description,
        discountPercentage: promo.discountPercentage ?? null,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
        termsAndConditions: promo.termsAndConditions,
        isActive: true,
      });
    }

    inserted++;
  }

  console.log(`✅ Supplier seeding complete. Added ${inserted} new suppliers.`);
}

export async function seedDatabase() {
  console.log("Seeding database...");

  const defaultCategories = [
    // 🔧 Construction
    { name: "Plumbing", description: "Water systems, piping, drainage, and repairs" },
    { name: "Electrical", description: "Electrical wiring, installations, and repairs" },
    { name: "Carpentry", description: "Wood structures, furniture, and fittings" },
    { name: "Masonry", description: "Brick, block, and stone construction" },
    { name: "Roofing", description: "Roof installation, repair, and waterproofing" },
    { name: "Plastering", description: "Wall plastering and surface finishing" },
    { name: "Tiling", description: "Floor and wall tile installation" },
    { name: "Painting", description: "Interior and exterior painting services" },

    // 🏠 Home Improvement
    { name: "Drywall & Ceiling", description: "Ceiling, drywall, and partition installation" },
    { name: "Flooring", description: "Wood, vinyl, epoxy, and carpet flooring" },
    { name: "Glazing", description: "Glass installation and repair" },
    { name: "Aluminium & Steel", description: "Doors, windows, frames, and metal fittings" },

    // ⚙️ Technical
    { name: "HVAC", description: "Heating, ventilation, and air conditioning systems" },
    { name: "Refrigeration", description: "Cooling system installation and repair" },
    { name: "Appliance Repair", description: "Household appliance repair services" },
    { name: "Solar Installation", description: "Solar panels and energy systems" },

    // 🌳 Outdoor
    { name: "Gardening", description: "Garden maintenance and plant care" },
    { name: "Landscaping", description: "Landscape design and outdoor construction" },
    { name: "Tree Felling", description: "Tree cutting and stump removal" },
    { name: "Paving", description: "Driveways and paving installation" },
    { name: "Fencing", description: "Fence installation and repairs" },

    // 🧹 Cleaning & Care
    { name: "Cleaning", description: "Residential and commercial cleaning" },
    { name: "Pest Control", description: "Insect and rodent control services" },
    { name: "Waste Removal", description: "Garbage and debris removal" },

    // 🚚 Manual & Logistics
    { name: "Moving", description: "House and office relocation services" },
    { name: "Handyman Services", description: "Small repairs and general tasks" }
  ];

  try {
    let inserted = 0;

    for (const category of defaultCategories) {
      const exists = await db
        .select()
        .from(categories)
        .where(eq(categories.name, category.name))
        .limit(1);

      if (exists.length === 0) {
        await db.insert(categories).values(category);
        inserted++;
      }
    }

    console.log(`✅ Seeding complete. Added ${inserted} new categories.`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
