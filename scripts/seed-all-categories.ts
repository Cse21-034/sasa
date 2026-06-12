import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

const ALL_CATEGORIES: { name: string; description: string }[] = [
  // ── Construction & Building ─────────────────────────────────────────────
  { name: "Plumbing",                          description: "Water systems, piping, drainage, and repairs" },
  { name: "Electrical",                        description: "Electrical wiring, installations, and repairs" },
  { name: "Carpentry",                         description: "Wood structures, furniture, and fittings" },
  { name: "Masonry",                           description: "Brick, block, and stone construction" },
  { name: "Roofing",                           description: "Roof installation, repair, and waterproofing" },
  { name: "Plastering",                        description: "Wall plastering and surface finishing" },
  { name: "Tiling",                            description: "Floor and wall tile installation" },
  { name: "Painting",                          description: "Interior and exterior painting services" },
  { name: "Drywall & Ceiling",                 description: "Ceiling, drywall, and partition installation" },
  { name: "Flooring",                          description: "Wood, vinyl, epoxy, and carpet flooring" },
  { name: "Glazing",                           description: "Glass installation and repair" },
  { name: "Aluminium & Steel",                 description: "Doors, windows, frames, and metal fittings" },
  { name: "Scaffolding",                       description: "Scaffolding erection and dismantling" },
  { name: "Waterproofing",                     description: "Damp-proofing and waterproof membrane application" },
  { name: "Excavation & Earthworks",           description: "Earthmoving, trenching, and site clearing" },
  { name: "Concrete Work",                     description: "Slabs, foundations, driveways, and concrete repairs" },
  { name: "Insulation",                        description: "Thermal and acoustic insulation installation" },
  { name: "Demolition",                        description: "Controlled demolition and structural removal" },
  { name: "Foundation Work",                   description: "Foundation laying, underpinning, and stabilisation" },
  { name: "Steel Erection",                    description: "Structural steel framing and erection" },
  { name: "Pool Construction",                 description: "Swimming pool building and renovation" },
  { name: "Deck & Patio Construction",         description: "Timber, composite, and concrete deck building" },
  { name: "Brickwork & Pointing",              description: "Bricklaying, re-pointing, and brick restoration" },
  { name: "Retaining Walls",                   description: "Retaining wall design and construction" },

  // ── Technical & Engineering ─────────────────────────────────────────────
  { name: "HVAC",                              description: "Heating, ventilation, and air conditioning systems" },
  { name: "Refrigeration",                     description: "Cooling system installation and repair" },
  { name: "Appliance Repair",                  description: "Household appliance repair services" },
  { name: "Solar Installation",                description: "Solar panels and off-grid energy systems" },
  { name: "Generator Installation",            description: "Generator supply, installation, and servicing" },
  { name: "Borehole Drilling",                 description: "Borehole and well drilling services" },
  { name: "Water Tank Installation",           description: "Water storage tank supply and installation" },
  { name: "Septic Tank Services",              description: "Septic tank installation, pumping, and repairs" },
  { name: "Irrigation Systems",               description: "Garden and agricultural irrigation installation" },
  { name: "Fire Safety Systems",               description: "Fire detection, sprinkler, and suppression systems" },
  { name: "Security Systems",                  description: "CCTV, alarm, and intruder detection systems" },
  { name: "Access Control",                    description: "Electric gates, intercoms, and biometric systems" },
  { name: "Smart Home Installation",           description: "Home automation, lighting, and smart device setup" },
  { name: "Satellite & TV Installation",       description: "DStv, CCTV, and aerial installation" },
  { name: "Network & Internet Setup",          description: "LAN, Wi-Fi, and fibre network installation" },
  { name: "Lift & Elevator Maintenance",       description: "Lift installation, servicing, and repairs" },
  { name: "Boiler Services",                   description: "Boiler installation, servicing, and repairs" },
  { name: "Gas Fitting",                       description: "Gas pipe installation, leak testing, and appliance connection" },
  { name: "Geyser Installation",               description: "Geyser supply, installation, and replacement" },

  // ── Technology & IT ──────────────────────────────────────────────────────
  { name: "Computer Repair",                   description: "Desktop and laptop hardware repair and upgrades" },
  { name: "Phone & Tablet Repair",             description: "Screen replacement and mobile device repairs" },
  { name: "IT Support",                        description: "On-site and remote IT helpdesk and support" },
  { name: "Web Design & Development",          description: "Website design, development, and maintenance" },
  { name: "Software Development",              description: "Custom software, apps, and system development" },
  { name: "Data Recovery",                     description: "Hard drive and data recovery services" },
  { name: "Cybersecurity",                     description: "Security audits, firewall setup, and threat protection" },
  { name: "Computer Networking",               description: "Network design, switches, and cabling" },
  { name: "CCTV Installation",                 description: "Camera systems for homes and businesses" },
  { name: "POS & Till Systems",                description: "Point-of-sale system installation and support" },
  { name: "Server Setup & Management",         description: "Server installation, virtualisation, and administration" },

  // ── Outdoor & Landscaping ────────────────────────────────────────────────
  { name: "Gardening",                         description: "Garden maintenance and plant care" },
  { name: "Landscaping",                       description: "Landscape design and outdoor construction" },
  { name: "Tree Felling",                      description: "Tree cutting, pruning, and stump removal" },
  { name: "Paving",                            description: "Driveways, pathways, and paving installation" },
  { name: "Fencing",                           description: "Fence installation and repairs" },
  { name: "Swimming Pool Maintenance",         description: "Pool cleaning, chemical balancing, and pump servicing" },
  { name: "Turf & Lawn Care",                  description: "Lawn mowing, fertilisation, and turf laying" },
  { name: "Stormwater & Drainage",             description: "Stormwater drainage design and installation" },
  { name: "Irrigation Installation",           description: "Sprinkler and drip irrigation systems" },
  { name: "Outdoor Lighting",                  description: "Garden and exterior lighting installation" },
  { name: "Artificial Grass",                  description: "Synthetic turf supply and installation" },
  { name: "Borehole Rehabilitation",           description: "Borehole cleaning, re-development, and pump replacement" },
  { name: "Rainwater Harvesting",              description: "Tank, guttering, and rainwater collection systems" },

  // ── Cleaning & Hygiene ───────────────────────────────────────────────────
  { name: "Cleaning",                          description: "Residential and commercial cleaning" },
  { name: "Pest Control",                      description: "Insect and rodent control services" },
  { name: "Waste Removal",                     description: "Garbage and debris removal" },
  { name: "Carpet & Upholstery Cleaning",      description: "Deep cleaning for carpets, sofas, and mattresses" },
  { name: "Window Cleaning",                   description: "Residential and commercial window washing" },
  { name: "Industrial Cleaning",               description: "Factory, warehouse, and site deep cleaning" },
  { name: "Fumigation",                        description: "Chemical fumigation for buildings and storage" },
  { name: "Drain Unblocking",                  description: "High-pressure drain jetting and unblocking" },
  { name: "Pressure Washing",                  description: "High-pressure cleaning of surfaces and buildings" },
  { name: "End of Tenancy Cleaning",           description: "Full deep clean for property handover" },
  { name: "Graffiti Removal",                  description: "Graffiti and paint removal from surfaces" },

  // ── Automotive ───────────────────────────────────────────────────────────
  { name: "Auto Mechanic",                     description: "Engine, gearbox, and general vehicle repairs" },
  { name: "Car Wash & Detailing",              description: "Vehicle washing, polishing, and detailing" },
  { name: "Auto Electrician",                  description: "Vehicle electrical wiring and fault diagnosis" },
  { name: "Panel Beating",                     description: "Body repairs, dent removal, and spray painting" },
  { name: "Tyre & Wheel Services",             description: "Tyre fitting, balancing, and puncture repairs" },
  { name: "Windscreen Repair",                 description: "Windscreen replacement and chip repair" },
  { name: "Auto Upholstery",                   description: "Seat covers, headliners, and interior trim" },
  { name: "Vehicle Towing",                    description: "Breakdown towing and recovery services" },
  { name: "Car Wrapping",                      description: "Vinyl wrapping and vehicle graphics" },
  { name: "Auto Air Conditioning",             description: "Vehicle aircon regas and system repair" },
  { name: "Auto Diagnostics",                  description: "Electronic fault code reading and diagnostics" },
  { name: "Brake Services",                    description: "Brake pad, disc, and caliper replacement" },
  { name: "Suspension & Steering",             description: "Shock absorbers, ball joints, and steering repairs" },
  { name: "Auto Locksmith",                    description: "Car key cutting, programming, and lockouts" },

  // ── Health & Beauty ──────────────────────────────────────────────────────
  { name: "Hairdressing",                      description: "Hair cutting, styling, and treatment" },
  { name: "Barbering",                         description: "Men's haircuts, fades, and beard grooming" },
  { name: "Nail Care",                         description: "Manicure, pedicure, and nail art" },
  { name: "Makeup & Beauty",                   description: "Makeup application and beauty therapy" },
  { name: "Massage Therapy",                   description: "Swedish, deep tissue, and therapeutic massage" },
  { name: "Personal Training",                 description: "Fitness coaching and exercise programming" },
  { name: "Physiotherapy",                     description: "Injury rehabilitation and movement therapy" },
  { name: "Tattoo & Piercing",                 description: "Tattoo artistry and body piercing" },
  { name: "Spa & Wellness",                    description: "Facials, body wraps, and relaxation treatments" },
  { name: "Nutritionist",                      description: "Dietary planning and nutritional consulting" },
  { name: "Occupational Therapy",              description: "Functional rehabilitation and adaptive support" },
  { name: "Podiatry",                          description: "Foot care, orthotics, and podiatric treatment" },
  { name: "Optometry",                         description: "Eye tests and prescription spectacles" },
  { name: "Dentistry",                         description: "Dental check-ups, fillings, and extractions" },
  { name: "Hearing Services",                  description: "Hearing tests and aid fitting" },
  { name: "Mental Health Counselling",         description: "Therapy, counselling, and psychotherapy" },
  { name: "Home Nursing Care",                 description: "Skilled nursing services at home" },

  // ── Professional Services ────────────────────────────────────────────────
  { name: "Accounting & Bookkeeping",          description: "Financial records, accounts, and payroll" },
  { name: "Legal Services",                    description: "Legal advice, contracts, and representation" },
  { name: "Tax Consulting",                    description: "Tax returns, compliance, and planning" },
  { name: "Business Registration",             description: "Company registration and compliance services" },
  { name: "Architecture",                      description: "Building design, plans, and permits" },
  { name: "Quantity Surveying",                description: "Cost estimation and bills of quantities" },
  { name: "Engineering Consulting",            description: "Civil, structural, and mechanical engineering advice" },
  { name: "Land Surveying",                    description: "Property boundary and topographic surveys" },
  { name: "Real Estate",                       description: "Property sales, rentals, and valuations" },
  { name: "Insurance Consulting",              description: "Insurance advice, claims, and brokerage" },
  { name: "Financial Advisory",                description: "Investment, retirement, and wealth planning" },
  { name: "Project Management",                description: "Construction and business project coordination" },
  { name: "Human Resources",                   description: "HR consulting, recruitment, and payroll management" },
  { name: "Property Management",               description: "Rental property administration and maintenance coordination" },
  { name: "Environmental Assessment",          description: "Environmental impact studies and compliance reports" },
  { name: "Supply Chain Consulting",           description: "Procurement, logistics, and supply chain optimisation" },

  // ── Creative & Media ─────────────────────────────────────────────────────
  { name: "Photography",                       description: "Portrait, event, product, and commercial photography" },
  { name: "Videography",                       description: "Video production, filming, and editing" },
  { name: "Graphic Design",                    description: "Logos, branding, and print design" },
  { name: "Interior Design",                   description: "Room layout, furnishing, and décor consulting" },
  { name: "Printing & Signage",                description: "Banners, signs, flyers, and branded materials" },
  { name: "Vehicle Branding",                  description: "Car and fleet vinyl branding and wraps" },
  { name: "Social Media Management",           description: "Content creation and social media account management" },
  { name: "Marketing & Advertising",           description: "Campaign strategy, media buying, and promotion" },
  { name: "Content Writing",                   description: "Blog posts, copywriting, and content creation" },
  { name: "Translation & Interpretation",      description: "Document translation and live interpretation" },
  { name: "Music Production",                  description: "Recording, mixing, mastering, and beat making" },
  { name: "Animation & Motion Graphics",       description: "Explainer videos, 2D/3D animation" },
  { name: "UI/UX Design",                      description: "App and website interface and experience design" },
  { name: "Drone Photography",                 description: "Aerial photography and videography using drones" },

  // ── Education & Training ─────────────────────────────────────────────────
  { name: "Private Tutoring",                  description: "One-on-one academic coaching for all grades" },
  { name: "Music Lessons",                     description: "Guitar, piano, violin, and vocal coaching" },
  { name: "Language Classes",                  description: "English, French, and foreign language instruction" },
  { name: "Driving Lessons",                   description: "Learner driver instruction and licence preparation" },
  { name: "Art Classes",                       description: "Drawing, painting, and sculpture instruction" },
  { name: "Computer & IT Training",            description: "MS Office, coding, and digital literacy courses" },
  { name: "Life Coaching",                     description: "Goal setting, motivation, and personal development" },
  { name: "Corporate Training",                description: "Staff development and workplace skills training" },
  { name: "Cooking Classes",                   description: "Culinary instruction and baking workshops" },
  { name: "Dance Classes",                     description: "Ballet, contemporary, and cultural dance instruction" },
  { name: "Sports Coaching",                   description: "Individual and team sport training and coaching" },

  // ── Events & Catering ────────────────────────────────────────────────────
  { name: "Catering Services",                 description: "Food preparation and service for events" },
  { name: "Event Planning",                    description: "Full-service event organisation and coordination" },
  { name: "Wedding Planning",                  description: "Wedding coordination, décor, and vendor management" },
  { name: "DJ Services",                       description: "Music mixing and DJ entertainment for events" },
  { name: "Live Music & Entertainment",        description: "Live bands, performers, and entertainers" },
  { name: "MC Services",                       description: "Master of ceremonies for events and functions" },
  { name: "Party Decoration",                  description: "Balloon art, table setup, and venue decoration" },
  { name: "Tent & Equipment Hire",             description: "Marquee tents, chairs, tables, and crockery hire" },
  { name: "Floral Arrangements",               description: "Wedding flowers, bouquets, and event florals" },
  { name: "Photo Booth Hire",                  description: "Selfie booth and photography prop hire" },
  { name: "Confectionery & Cakes",             description: "Custom cakes, pastries, and dessert tables" },
  { name: "Bouncing Castles",                  description: "Children's entertainment inflatable hire" },

  // ── Care & Personal Services ─────────────────────────────────────────────
  { name: "Babysitting & Childcare",           description: "In-home childcare and babysitting" },
  { name: "Elderly Care",                      description: "Home-based care and companionship for seniors" },
  { name: "Special Needs Support",             description: "Care and assistance for people with disabilities" },
  { name: "Dog Walking",                       description: "Dog walking and pet exercise services" },
  { name: "Pet Grooming",                      description: "Dog bathing, clipping, and pet grooming" },
  { name: "Pet Sitting",                       description: "In-home pet care and boarding" },
  { name: "Veterinary Services",               description: "Animal health checks, vaccinations, and treatment" },
  { name: "Personal Chef",                     description: "Private cooking, meal prep, and catering at home" },
  { name: "Personal Shopper",                  description: "Shopping assistance and errand running" },
  { name: "Laundry & Ironing",                 description: "Wash, dry, iron, and fold services" },

  // ── Clothing & Fashion ───────────────────────────────────────────────────
  { name: "Tailoring & Alterations",           description: "Custom clothing and garment alterations" },
  { name: "Shoe Repair",                       description: "Sole replacement and footwear restoration" },
  { name: "Dry Cleaning",                      description: "Professional garment dry cleaning and pressing" },
  { name: "Uniform Manufacturing",             description: "Corporate and school uniform production" },
  { name: "Fashion Design",                    description: "Original garment design and dressmaking" },
  { name: "Embroidery & Printing",             description: "Logo embroidery and garment screen printing" },

  // ── Metalwork & Fabrication ──────────────────────────────────────────────
  { name: "Welding",                           description: "Metal welding and fabrication services" },
  { name: "Steel Fabrication",                 description: "Custom steel structures and components" },
  { name: "Gate & Fence Making",               description: "Custom gate and security fence fabrication" },
  { name: "Blacksmithing",                     description: "Ornamental ironwork and blacksmithing" },
  { name: "Aluminium Fabrication",             description: "Aluminium windows, doors, and structures" },
  { name: "Sheet Metal Work",                  description: "Ductwork, cladding, and sheet metal fabrication" },

  // ── Logistics & Transport ────────────────────────────────────────────────
  { name: "Moving & Relocation",               description: "House and office relocation services" },
  { name: "Courier & Delivery",                description: "Same-day and scheduled parcel delivery" },
  { name: "Truck & Bakkie Hire",               description: "Light and heavy vehicle hire with or without driver" },
  { name: "Freight & Logistics",               description: "Goods transport and supply chain logistics" },
  { name: "Airport Transfers",                 description: "Scheduled airport pick-up and drop-off" },
  { name: "Charter & Car Hire",                description: "Private vehicle hire for travel and tourism" },
  { name: "Crane & Heavy Lift",                description: "Crane hire and heavy lifting operations" },

  // ── Agriculture & Farming ────────────────────────────────────────────────
  { name: "Poultry & Livestock",               description: "Animal husbandry, feeding, and health management" },
  { name: "Crop Spraying",                     description: "Pesticide and fertiliser aerial or ground spraying" },
  { name: "Farm Fencing",                      description: "Game, livestock, and perimeter farm fencing" },
  { name: "Soil Testing",                      description: "Soil analysis and composting recommendations" },
  { name: "Greenhouse Setup",                  description: "Tunnel and greenhouse construction and fitting" },
  { name: "Hydroponics Setup",                 description: "Hydroponic system design and installation" },
  { name: "Beekeeping Services",               description: "Hive setup, honey harvesting, and bee removal" },
  { name: "Aquaponics & Fish Farming",         description: "Fish farming and aquaponic system setup" },

  // ── Funeral & Memorial ───────────────────────────────────────────────────
  { name: "Funeral Services",                  description: "Funeral arrangements, burial, and cremation" },
  { name: "Tombstone & Memorial",              description: "Headstone inscription and memorial installation" },

  // ── Security & Safety ───────────────────────────────────────────────────
  { name: "Security Guard Services",           description: "Manned guarding and patrol services" },
  { name: "Safe Installation",                 description: "Safe supply, bolting, and relocation" },
  { name: "Alarm Response",                    description: "Armed and unarmed alarm response services" },
  { name: "Fire Safety Compliance",            description: "Fire risk assessments and extinguisher servicing" },
  { name: "Locksmith Services",                description: "Lock fitting, key cutting, and lockout assistance" },

  // ── Water & Sanitation ───────────────────────────────────────────────────
  { name: "Water Purification",                description: "Water filtration, treatment, and purification systems" },
  { name: "Portable Toilet Hire",              description: "Chemical toilet hire for events and construction sites" },
  { name: "Sanitation Services",               description: "Commercial sanitation and hygiene management" },

  // ── Furniture & Fitouts ──────────────────────────────────────────────────
  { name: "Furniture Assembly",                description: "Flat-pack and custom furniture assembly" },
  { name: "Kitchen Fitting",                   description: "Kitchen cupboard installation and worktop fitting" },
  { name: "Bathroom Renovation",               description: "Full bathroom refits and wet room conversions" },
  { name: "Wardrobe & Cupboard Installation",  description: "Built-in wardrobe and custom storage fitting" },
  { name: "Custom Furniture Making",           description: "Bespoke furniture crafted to order" },
  { name: "Curtain & Blind Fitting",           description: "Curtain tracks, blinds, and shutter installation" },

  // ── Handyman & General ───────────────────────────────────────────────────
  { name: "Handyman Services",                 description: "Small repairs and general maintenance tasks" },
  { name: "Odd Jobs",                          description: "General household tasks and small fixes" },
];

async function run() {
  console.log(`\n🚀 Inserting ${ALL_CATEGORIES.length} categories (skipping duplicates)...\n`);

  // Single query: insert rows whose name doesn't already exist, return what was inserted
  const valuePlaceholders = ALL_CATEGORIES
    .map((_, i) => `($${i * 2 + 1}::text, $${i * 2 + 2}::text)`)
    .join(', ');

  const params: string[] = [];
  for (const cat of ALL_CATEGORIES) {
    params.push(cat.name, cat.description);
  }

  const query = `
    INSERT INTO categories (name, description)
    SELECT v.name, v.description
    FROM (VALUES ${valuePlaceholders}) AS v(name, description)
    WHERE NOT EXISTS (
      SELECT 1 FROM categories c WHERE c.name = v.name
    )
    RETURNING name
  `;

  const inserted = await sql(query, params);

  console.log(`✅ Inserted ${inserted.length} new categories.`);
  console.log(`   Skipped  ${ALL_CATEGORIES.length - inserted.length} (already existed).`);
  console.log(`\n📋 New categories added:`);
  for (const row of inserted) {
    console.log(`   • ${row.name}`);
  }
  console.log(`\nDone.\n`);
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
