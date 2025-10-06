// Run this script locally (node scripts/flatten-structure.js)
// It will remove duplicate component shims under src/app/components and the app-level hook file.
const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'src/app/components/PasswordGenerator.tsx',
  'src/app/components/Vault/VaultPanel.tsx',
  'src/app/components/Vault/VaultItemCard.tsx',
  'src/app/hooks/useClipboardAutoClear.ts',
];

for (const rel of filesToDelete) {
  const p = path.join(__dirname, '..', rel);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('Deleted', p);
    } else {
      console.log('Not found', p);
    }
  } catch (e) {
    console.error('Failed to delete', p, e.message);
  }
}
