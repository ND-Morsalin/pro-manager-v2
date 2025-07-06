import fs from "fs";
import path from "path";

// Paths
const baseSchemaPath = path.join(__dirname, "base.prisma");
const modelsDir = path.join(__dirname, "models");
const outputPath = path.join(__dirname, "../prisma/schema.prisma");

// Read base.prisma
const baseSchema = fs.readFileSync(baseSchemaPath, "utf-8");

// Read and combine all model files
const modelSchemas = fs
  .readdirSync(modelsDir)
  .filter((file) => file.endsWith(".prisma"))
  .map((file) => fs.readFileSync(path.join(modelsDir, file), "utf-8"))
  .join("\n\n");

// Merge everything
const finalSchema = `${baseSchema.trim()}\n\n${modelSchemas.trim()}`;

// Write to output
fs.writeFileSync(outputPath, finalSchema);
console.log("✅ Prisma schema generated at prisma/schema.prisma");
