const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const DEV_SERVER_URL = "http://localhost:5174";
const isWindows = process.platform === "win32";
const viteBin = isWindows
  ? path.join("node_modules", ".bin", "vite.cmd")
  : path.join("node_modules", ".bin", "vite");
const electronBin = String(require("electron")).trim();

let electronProcess;

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for Vite dev server at ${url}`));
          return;
        }

        setTimeout(check, 300);
      });
    };

    check();
  });
}

const viteProcess = spawn(viteBin, ["--host", "0.0.0.0", "--port", "5174", "--strictPort"], {
  stdio: "inherit",
  env: { ...process.env },
});

viteProcess.on("error", (error) => {
  console.error(`Failed to start Vite dev server: ${error.message}`);
  process.exit(1);
});

waitForServer(DEV_SERVER_URL)
  .then(() => {
    const env = {
      ...process.env,
      VITE_DEV_SERVER_URL: DEV_SERVER_URL,
    };
    delete env.ELECTRON_RUN_AS_NODE;

    electronProcess = spawn(electronBin, ["electron/main/index.js"], {
      stdio: "inherit",
      env,
    });

    electronProcess.on("error", (error) => {
      console.error(`Failed to start Electron: ${error.message}`);
      viteProcess.kill();
      process.exit(1);
    });

    electronProcess.on("exit", (code) => {
      viteProcess.kill();
      process.exit(code ?? 0);
    });
  })
  .catch((error) => {
    console.error(error.message);
    viteProcess.kill();
    process.exit(1);
  });

process.on("SIGINT", () => {
  electronProcess?.kill();
  viteProcess.kill();
  process.exit(130);
});

process.on("SIGTERM", () => {
  electronProcess?.kill();
  viteProcess.kill();
  process.exit(143);
});
