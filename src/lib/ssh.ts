import { Client, type ConnectConfig } from "ssh2";

function getSSHConfig(): ConnectConfig {
  const config: ConnectConfig = {
    host: process.env.SSH_HOST || "localhost",
    port: parseInt(process.env.SSH_PORT || "22"),
    username: process.env.SSH_USERNAME || "root",
  };

  if (process.env.SSH_PRIVATE_KEY) {
    config.privateKey = Buffer.from(process.env.SSH_PRIVATE_KEY, "base64");
  } else if (process.env.SSH_PASSWORD) {
    config.password = process.env.SSH_PASSWORD;
  }

  return config;
}

export function createSSHConnection(): Promise<Client> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", () => resolve(conn))
      .on("error", (err) => reject(err))
      .connect(getSSHConfig());
  });
}

export function executeCommand(conn: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      let errorOutput = "";
      stream
        .on("close", () => resolve(output || errorOutput))
        .on("data", (data: Buffer) => {
          output += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          errorOutput += data.toString();
        });
    });
  });
}

export async function runSSHCommand(command: string): Promise<string> {
  const conn = await createSSHConnection();
  try {
    return await executeCommand(conn, command);
  } finally {
    conn.end();
  }
}

export interface ServerMetricsRaw {
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkIn: number;
  networkOut: number;
  uptime: string;
  loadAverage: string;
  hostname: string;
}

export async function getServerMetrics(): Promise<ServerMetricsRaw> {
  const conn = await createSSHConnection();
  try {
    // Run all commands in parallel
    const [cpuRaw, memRaw, diskRaw, uptimeRaw, hostnameRaw, networkRaw] =
      await Promise.all([
        executeCommand(
          conn,
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"
        ),
        executeCommand(conn, "free -m | grep Mem"),
        executeCommand(conn, "df -h / | tail -1"),
        executeCommand(conn, "uptime -p 2>/dev/null || uptime"),
        executeCommand(conn, "hostname"),
        executeCommand(
          conn,
          "cat /proc/net/dev | grep -E 'eth0|ens' | head -1"
        ),
      ]);

    // Parse CPU
    const cpuUsage = parseFloat(cpuRaw.trim()) || 0;

    // Parse Memory: Mem: total used free shared buff/cache available
    const memParts = memRaw.trim().split(/\s+/);
    const ramTotal = parseFloat(memParts[1]) || 0;
    const ramUsed = parseFloat(memParts[2]) || 0;
    const ramUsage = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;

    // Parse Disk: /dev/xxx size used avail use% mount
    const diskParts = diskRaw.trim().split(/\s+/);
    const diskTotal = parseFloat(diskParts[1]) || 0;
    const diskUsage = parseFloat(diskParts[4]?.replace("%", "")) || 0;

    // Parse Network
    const netParts = networkRaw.trim().split(/\s+/);
    const networkIn = parseFloat(netParts[1]) || 0;
    const networkOut = parseFloat(netParts[9]) || 0;

    return {
      cpuUsage,
      ramUsage,
      ramTotal,
      diskUsage,
      diskTotal,
      networkIn: networkIn / 1024, // Convert to KB
      networkOut: networkOut / 1024,
      uptime: uptimeRaw.trim(),
      loadAverage: "",
      hostname: hostnameRaw.trim(),
    };
  } finally {
    conn.end();
  }
}

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  permissions: string;
}

export async function listDirectory(dirPath: string): Promise<FileInfo[]> {
  const output = await runSSHCommand(
    `ls -la --time-style=long-iso "${dirPath}" 2>/dev/null | tail -n +2`
  );
  const lines = output.trim().split("\n").filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length < 8) return null;
      const permissions = parts[0];
      const size = parseInt(parts[4]) || 0;
      const date = parts[5];
      const time = parts[6];
      const name = parts.slice(7).join(" ");

      if (name === "." || name === "..") return null;

      return {
        name,
        path: `${dirPath}/${name}`.replace("//", "/"),
        isDirectory: permissions.startsWith("d"),
        size,
        modified: `${date} ${time}`,
        permissions,
      };
    })
    .filter((f): f is FileInfo => f !== null);
}

export async function readFileContent(filePath: string): Promise<string> {
  return runSSHCommand(`cat "${filePath}" 2>/dev/null`);
}

export async function writeFileContent(
  filePath: string,
  content: string
): Promise<void> {
  const conn = await createSSHConnection();
  try {
    const escaped = content.replace(/'/g, "'\\''");
    await executeCommand(conn, `echo '${escaped}' > "${filePath}"`);
  } finally {
    conn.end();
  }
}

export function isSSHConfigured(): boolean {
  return !!(
    process.env.SSH_HOST &&
    (process.env.SSH_PRIVATE_KEY || process.env.SSH_PASSWORD)
  );
}
