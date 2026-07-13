import { app } from 'electron';
console.log("app:", typeof app);
app.whenReady().then(() => { console.log("ready"); app.quit(); });
