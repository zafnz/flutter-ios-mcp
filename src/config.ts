// Global configuration for the server
let serverHost = 'localhost';
let serverPort = 3000;
let lastKnownHostHeader: string | undefined;

export function setServerConfig(host: string, port: number): void {
  serverHost = host;
  serverPort = port;
}

export function updateHostHeader(hostHeader: string): void {
  lastKnownHostHeader = hostHeader;
}

export function getServerBaseUrl(): string {
  // Prefer the last known Host header from an actual request
  // This allows the URL to work correctly regardless of how clients access the server
  // (localhost, host.docker.internal, IP address, etc.)
  if (lastKnownHostHeader) {
    return `http://${lastKnownHostHeader}`;
  }

  // Fallback to configured host and port
  return `http://${serverHost}:${String(serverPort)}`;
}
