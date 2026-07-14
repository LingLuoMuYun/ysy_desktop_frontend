/**
 * Patch electron-builder@26.15.3 for two known bugs:
 *
 * Bug 1: ElectronDownloadCacheMode enum missing from @electron/get
 * Bug 2: Windows EPERM on fs.rename(tmpDir, dir) due to AV file handles
 *
 * Usage: node scripts/patch-electron-builder.cjs
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob'); // not available — use manual resolution

// Find the app-builder-lib electronGet.js file
const nodeModulesDir = path.join(__dirname, '..', 'node_modules', '.pnpm');

function findElectronGetJs() {
  for (const entry of fs.readdirSync(nodeModulesDir)) {
    if (entry.startsWith('app-builder-lib@')) {
      const candidate = path.join(
        nodeModulesDir,
        entry,
        'node_modules',
        'app-builder-lib',
        'out',
        'util',
        'electronGet.js'
      );
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

const target = findElectronGetJs();

if (!target) {
  console.error('ERROR: Could not find app-builder-lib electronGet.js');
  console.error('Is electron-builder installed? Run: pnpm install');
  process.exit(1);
}

console.log(`Found: ${target}`);

let content = fs.readFileSync(target, 'utf-8');
let patched = false;

// --- Patch 1: resolveCacheMode ---
const OLD_RESOLVE = `function resolveCacheMode() {
    var _a;
    const varName = "ELECTRON_DOWNLOAD_CACHE_MODE";
    const cacheOverride = (_a = process.env[varName]) === null || _a === void 0 ? void 0 : _a.trim();
    if (cacheOverride && Number(cacheOverride) in get_1.ElectronDownloadCacheMode) {
        const mode = Number(cacheOverride);
        builder_util_1.log.debug({ mode }, \`cache mode overridden via env var \${varName}\`);
        return mode;
    }
    return get_1.ElectronDownloadCacheMode.ReadWrite;
}`;

const NEW_RESOLVE = `function resolveCacheMode() {
    return undefined;
}`;

if (content.includes(OLD_RESOLVE)) {
  content = content.replace(OLD_RESOLVE, NEW_RESOLVE);
  console.log('✓ Patch 1 applied: resolveCacheMode');
  patched = true;
} else if (content.includes('return undefined;')) {
  console.log('  Patch 1 already applied');
} else {
  console.warn('⚠ Patch 1: resolveCacheMode pattern not found (code may have changed)');
}

// --- Patch 2: ElectronDownloadCacheMode.WriteOnly ---
const OLD_WRITEONLY = `filePath = await get.downloadArtifact({ ...configWithProgress, cacheMode: get_1.ElectronDownloadCacheMode.WriteOnly });`;

const NEW_WRITEONLY = `filePath = await get.downloadArtifact({ ...configWithProgress });`;

if (content.includes(OLD_WRITEONLY)) {
  content = content.replace(OLD_WRITEONLY, NEW_WRITEONLY);
  console.log('✓ Patch 2 applied: WriteOnly reference removed');
  patched = true;
} else if (!content.includes('ElectronDownloadCacheMode')) {
  console.log('  Patch 2 already applied');
} else {
  console.warn('⚠ Patch 2: WriteOnly pattern not found (code may have changed)');
}

// --- Patch 3: cp+rm instead of rename ---
const OLD_RENAME = `        await fs.rm(dir, { recursive: true, force: true });
        await fs.rename(tmpDir, dir);`;

const NEW_RENAME = `        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
        // Use cp+rm instead of rename on Windows — AV may hold file handles on extracted contents
        await fs.cp(tmpDir, dir, { recursive: true, force: true });
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});`;

if (content.includes(OLD_RENAME)) {
  content = content.replace(OLD_RENAME, NEW_RENAME);
  console.log('✓ Patch 3 applied: cp+rm replaces rename');
  patched = true;
} else if (content.includes('cp+rm instead of rename')) {
  console.log('  Patch 3 already applied');
} else {
  console.warn('⚠ Patch 3: rename pattern not found (code may have changed)');
}

if (patched) {
  fs.writeFileSync(target, content, 'utf-8');
  console.log('\nPatches applied successfully.');
  console.log('Run packaging with: ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm run electron:package:win');
} else {
  console.log('\nNo patches needed — all already applied.');
}
