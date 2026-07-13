import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require('electron');

console.log("Imports successful via createRequire");
app.whenReady().then(() => { 
  console.log("App ready"); 
  app.quit(); 
});
