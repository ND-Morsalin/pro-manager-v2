const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  oldRoutesFile: path.join(__dirname, 'src', 'routes', 'routes.ts'),
  newRoutesBase: path.join(__dirname, 'src', 'routes'),
  moduleEndpoints: {
    auth: [
      { path: 'create-shop-owner', methods: ['post'] },
      { path: 'login', methods: ['post'] },
      { path: 'forget-password', methods: ['post'] },
      { path: 'check-otp', methods: ['post'] },
      { path: 'reset-password', methods: ['post'] },
      { path: 'update-shop-owner/:id', methods: ['put'] },
      { path: 'shop-owner/:id', methods: ['get'] },
      { path: 'delete-shop-owner/:id', methods: ['delete'] }
    ],
    products: [
      { path: 'products', methods: ['get', 'post'] },
      { path: 'product/:id', methods: ['get', 'put', 'delete'] },
      { path: 'selling-product-by-date', methods: ['post'] }
    ],
    customers: [
      { path: 'customer', methods: ['get', 'post'] },
      { path: 'customer/:id', methods: ['get', 'put', 'delete'] },
      { path: 'customer-by-phone/:phone', methods: ['get'] }
    ],
    // Add other modules as needed...
  }
};

// Helper functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readOldRoutes() {
  try {
    return fs.readFileSync(config.oldRoutesFile, 'utf8');
  } catch (err) {
    console.error('Error reading old routes file:', err);
    process.exit(1);
  }
}

function extractRoutesForModule(moduleName, routesContent) {
  const moduleRoutes = [];
  const endpoints = config.moduleEndpoints[moduleName] || [];

  endpoints.forEach(endpoint => {
    endpoint.methods.forEach(method => {
      // More flexible regex pattern
      const pattern = new RegExp(
        `router\\.${method}\\(\\s*['"]\\/?${endpoint.path.replace(/:\w+/g, '\\w+')}['"][\\s\\S]*?\\}\\)(?:\\s*\\.\\w+\\([^)]*\\))*`,
        'g'
      );

      const matches = routesContent.match(pattern);
      if (matches) {
        moduleRoutes.push(...matches.map(route => route.trim()));
      }
    });
  });

  return moduleRoutes;
}

function createModuleRouteFile(moduleName, routes) {
  if (routes.length === 0) {
    console.log(`⚠️ No routes found for module: ${moduleName}`);
    return;
  }

  const modulePath = path.join(config.newRoutesBase, moduleName);
  ensureDirectoryExists(modulePath);

  const routeFilePath = path.join(modulePath, 'routes.ts');
  
  // Generate imports based on route handlers
  const imports = new Set();
  imports.add('import { Router } from "express";');
  imports.add('import checkValidUser from "../../middleware/checkValidUser";');
  
  // Add common middleware imports
  if (moduleName === 'auth') {
    imports.add('import shopOwnerBodyChecker from "../../middleware/shopOwner/shopOwnerValidator";');
    imports.add('import logInValidator from "../../middleware/shopOwner/loginValidator";');
    imports.add('import handleValidationErrors from "../../middleware/handelValidatorError";');
  }

  const content = `${Array.from(imports).join('\n')}

const router = Router();

${routes.join('\n\n')}

export default router;
`;

  fs.writeFileSync(routeFilePath, content);
  console.log(`✅ Created ${routes.length} routes for ${moduleName}`);
}

// Main function
function distributeRoutes() {
  console.log('🚀 Starting route distribution...');
  const oldRoutesContent = readOldRoutes();

  Object.keys(config.moduleEndpoints).forEach(module => {
    console.log(`\n🔍 Processing module: ${module}`);
    const moduleRoutes = extractRoutesForModule(module, oldRoutesContent);
    createModuleRouteFile(module, moduleRoutes);
  });

  console.log('\n🎉 Route distribution completed!');
}

distributeRoutes();