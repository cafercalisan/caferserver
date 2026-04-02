const COOLIFY_API_URL = process.env.COOLIFY_API_URL || "http://localhost:8000";
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN || "";

async function coolifyFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${COOLIFY_API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${COOLIFY_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Coolify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function listApplications() {
  return coolifyFetch("/applications");
}

export async function getApplication(uuid: string) {
  return coolifyFetch(`/applications/${uuid}`);
}

export async function deployApplication(uuid: string) {
  return coolifyFetch(`/applications/${uuid}/deploy`, { method: "POST" });
}

export async function restartApplication(uuid: string) {
  return coolifyFetch(`/applications/${uuid}/restart`, { method: "POST" });
}

export async function getApplicationLogs(uuid: string) {
  return coolifyFetch(`/applications/${uuid}/logs`);
}

export async function getServers() {
  return coolifyFetch("/servers");
}

export async function getServerResources(uuid: string) {
  return coolifyFetch(`/servers/${uuid}/resources`);
}

export function isCoolifyConfigured(): boolean {
  return !!COOLIFY_API_TOKEN;
}
