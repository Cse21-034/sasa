import { db } from "./db";
import { categories } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database...");

  const defaultCategories = [
    // 🔧 Core Construction & Building Trades
    { name: "Plumbing", description: "Water systems, piping, drainage, and repairs" },
    { name: "Electrical", description: "Electrical wiring, installations, and repairs" },
    { name: "Carpentry", description: "Wood structures, furniture, and fittings" },
    { name: "Masonry", description: "Brick, block, and stone construction" },
    { name: "Roofing", description: "Roof installation, repair, and waterproofing" },
    { name: "Plastering", description: "Wall plastering and surface finishing" },
    { name: "Tiling", description: "Floor and wall tile installation" },
    { name: "Painting", description: "Interior and exterior painting services" },

    // 🏠 Home Improvement & Finishing
    { name: "Drywall & Ceiling", description: "Ceiling, drywall, and partition installation" },
    { name: "Flooring", description: "Wood, vinyl, epoxy, and carpet flooring" },
    { name: "Glazing", description: "Glass installation and repair" },
    { name: "Aluminium & Steel", description: "Doors, windows, frames, and metal fittings" },
    { name: "Interior Decoration", description: "Interior finishing and decorative services" },

    // ⚙️ Mechanical, Electrical & Technical
    { name: "HVAC", description: "Heating, ventilation, and air conditioning systems" },
    { name: "Refrigeration", description: "Fridge, freezer, and cooling system repair" },
    { name: "Appliance Repair", description: "Household appliance repair services" },
    { name: "Solar Installation", description: "Solar panels, inverters, and energy systems" },
    { name: "Generator Services", description: "Generator installation and maintenance" },

    // 🚗 Automotive & Transport
    { name: "Auto Mechanic", description: "Vehicle repair and servicing" },
    { name: "Auto Electrician", description: "Vehicle electrical diagnostics and repair" },
    { name: "Panel Beating", description: "Vehicle body repair and spray painting" },
    { name: "Tyre Services", description: "Tyre fitting, balancing, and repairs" },

    // 🌳 Outdoor & Environmental
    { name: "Gardening", description: "Garden maintenance and plant care" },
    { name: "Landscaping", description: "Landscape design and outdoor construction" },
    { name: "Tree Felling", description: "Tree cutting and stump removal" },
    { name: "Paving", description: "Driveways, walkways, and paving installation" },
    { name: "Fencing", description: "Fence installation and repairs" },

    // 🧹 Cleaning & Property Care
    { name: "Cleaning", description: "Residential and commercial cleaning" },
    { name: "Pest Control", description: "Insect and rodent control services" },
    { name: "Waste Removal", description: "Garbage and debris removal services" },
    { name: "Property Maintenance", description: "General building maintenance services" },

    // 🔐 Security & Safety
    { name: "Security Systems", description: "CCTV, alarms, and access control installation" },
    { name: "Gate & Garage Installation", description: "Motorized gates and garage doors" },
    { name: "Fire Safety", description: "Fire alarms and extinguisher installation" },

    // 🚚 Logistics & Manual Services
    { name: "Moving", description: "House and office relocation services" },
    { name: "Furniture Assembly", description: "Assembly and disassembly of furniture" },
    { name: "Handyman Services", description: "Small repairs and general tasks" }
  ];

  try {
    const existingCategories = await db.select().from(categories);

    if (existingCategories.length === 0) {
      await db.insert(categories).values(defaultCategories);
      console.log("✅ Categories seeded successfully");
    } else {
      console.log("ℹ️  Categories already exist, skipping seed");
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
