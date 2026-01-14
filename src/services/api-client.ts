import * as vscode from 'vscode';

/**
 * Client for communicating with the Dev Proxy API.
 *
 * Dev Proxy exposes a local HTTP API for controlling the proxy.
 * This client encapsulates all API calls with proper error handling and typing.
 *
 * API endpoints:
 * - GET  /proxy           - Get proxy status
 * - POST /proxy           - Update proxy state (recording)
 * - POST /proxy/stopproxy - Stop the proxy
 * - POST /proxy/mockrequest - Raise a mock request
 */
export class DevProxyApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(port: number, timeout = 5000) {
    this.baseUrl = `http://localhost:${port}`;
    this.timeout = timeout;
  }

  /**
   * Create a client using the configured API port from VS Code settings.
   */
  static fromConfiguration(): DevProxyApiClient {
    const config = vscode.workspace.getConfiguration('dev-proxy-toolkit');
    const port = config.get<number>('apiPort', 8897);
    return new DevProxyApiClient(port);
  }

  /**
   * Check if Dev Proxy is running by attempting to connect to the API.
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/proxy`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.status >= 200 && response.status < 500;
    } catch {
      return false;
    }
  }

  /**
   * Stop the proxy.
   */
  async stop(): Promise<void> {
    await this.post('/proxy/stopproxy');
  }

  /**
   * Raise a mock request.
   */
  async raiseMockRequest(): Promise<void> {
    await this.post('/proxy/mockrequest');
  }

  /**
   * Start recording API requests.
   */
  async startRecording(): Promise<void> {
    await this.post('/proxy', { recording: true });
  }

  /**
   * Stop recording API requests.
   */
  async stopRecording(): Promise<void> {
    await this.post('/proxy', { recording: false });
  }

  /**
   * Get the current proxy status.
   */
  async getStatus(): Promise<ProxyStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/proxy`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as ProxyStatus;
    } catch {
      return null;
    }
  }

  private async post(endpoint: string, body?: object): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response;
  }
}

/**
 * Proxy status returned from the API.
 */
export interface ProxyStatus {
  recording?: boolean;
  // Add other status properties as they become known
}
