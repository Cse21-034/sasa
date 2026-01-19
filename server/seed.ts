import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

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
