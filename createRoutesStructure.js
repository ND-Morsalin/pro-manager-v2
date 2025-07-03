const fs = require('fs');
const path = require('path');

// Main configuration
const config = {
  basePath: './src/routes',
  modules: [
    'auth', 'products', 'customers', 'payment-history', 'loan-providers',
    'product-voicers', 'business-contact', 'cash', 'reports',
    'product-give-take', 'categories', 'sms', 'notes',
    'raw-products', 'raw-categories', 'suppliers'
  ],
  files: ['index.ts', 'routes.ts'],
  modulesWithValidation: ['auth', 'products', 'customers']
};

// Create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Create file with basic content if it doesn't exist
function createFileIfNotExists(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created file: ${filePath}`);
  }
}

// Generate route file content
function getRouteFileContent(moduleName) {
  return `import { Router } from "express";
const router = Router();

// Add your ${moduleName} routes here

export default router;
`;
}

// Generate index file content
function getIndexFileContent() {
  return `import { Router } from "express";
import authRouter from "./auth/routes";
// Import other routers as needed

const router = Router();

router.use("/auth", authRouter);
// Add other route modules here

export default router;
`;
}

// Main function to create the structure
function createRouteStructure() {
  try {
    // Create base routes directory
    ensureDirectoryExists(config.basePath);

    // Create each module
    config.modules.forEach(module => {
      const modulePath = path.join(config.basePath, module);
      ensureDirectoryExists(modulePath);

      // Create standard files
      config.files.forEach(file => {
        const filePath = path.join(modulePath, file);
        const content = file === 'routes.ts' ? getRouteFileContent(module) : '';
        createFileIfNotExists(filePath, content);
      });

      // Create validator for specific modules
      if (config.modulesWithValidation.includes(module)) {
        const validatorPath = path.join(modulePath, 'validator.ts');
        createFileIfNotExists(validatorPath, `import { body } from "express-validator";

export const ${module}Validator = [
  // Add your validation rules here
];
`);
      }
    });

    // Create main index file
    const mainIndexPath = path.join(config.basePath, 'index.ts');
    createFileIfNotExists(mainIndexPath, getIndexFileContent());

    console.log('\x1b[32m%s\x1b[0m', '✅ Route structure created successfully!');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error creating route structure:', error);
  }
}

// Execute the script
createRouteStructure();