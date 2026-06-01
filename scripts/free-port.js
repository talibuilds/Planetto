const { execSync } = require('child_process');

const PORT = 8081;

function freePort() {
  try {
    if (process.platform === 'win32') {
      // Find PID on Windows
      const stdout = execSync(`netstat -ano`).toString();
      const lines = stdout.split('\n');
      const searchStr = `:${PORT}`;
      // Look for a line containing the port and LISTENING
      const matchingLine = lines.find(line => line.includes(searchStr) && line.toUpperCase().includes('LISTENING'));
      if (matchingLine) {
        const parts = matchingLine.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== process.pid.toString()) {
          console.log(`[Port Fix] Found process ${pid} using port ${PORT}. Killing it...`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
        }
      }
    } else {
      // macOS/Linux
      try {
        const pid = execSync(`lsof -t -i:${PORT}`).toString().trim();
        if (pid && pid !== process.pid.toString()) {
          console.log(`[Port Fix] Found process ${pid} using port ${PORT}. Killing it...`);
          execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
        }
      } catch (err) {
        // lsof returns exit code 1 if no process found
      }
    }
  } catch (error) {
    console.error('[Port Fix] Failed to free port:', error.message);
  }
}

freePort();
