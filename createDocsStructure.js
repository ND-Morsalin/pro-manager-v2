// createDocsStructure.js
const fs = require('fs');
const path = require('path');

const structure = {
  docs: {
    components: {
      schemas: [
        'authentication.yaml',
        'product.yaml',
        'customer.yaml',
        'loan.yaml',
        'cash.yaml',
        'notes.yaml',
        'business_contact.yaml',
        'dashboard.yaml',
        'common.yaml',
      ]
    },
    paths: [
      'authentication.yaml',
      'product.yaml',
      'customer.yaml',
      'loan.yaml',
      'cash.yaml',
      'notes.yaml',
      'business_contact.yaml',
      'dashboard.yaml',
    ],
    rootFiles: ['main.yaml']
  }
};

function createStructure(basePath, structure) {
  const docsPath = path.join(basePath, 'docs');
  fs.mkdirSync(docsPath, { recursive: true });

  // Create components/schemas
  const schemasPath = path.join(docsPath, 'components', 'schemas');
  fs.mkdirSync(schemasPath, { recursive: true });
  structure.docs.components.schemas.forEach(filename => {
    fs.writeFileSync(path.join(schemasPath, filename), '');
  });

  // Create paths
  const pathsPath = path.join(docsPath, 'paths');
  fs.mkdirSync(pathsPath, { recursive: true });
  structure.docs.paths.forEach(filename => {
    fs.writeFileSync(path.join(pathsPath, filename), '');
  });

  // Create root files
  structure.docs.rootFiles.forEach(filename => {
    fs.writeFileSync(path.join(docsPath, filename), '');
  });
}

createStructure(__dirname, structure);
console.log('Directory structure and files created successfully.');
