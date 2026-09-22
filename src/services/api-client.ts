import * as vscode from 'vscode';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';
import * as logger from '../logger';
import { executeFile } from '../utils/shell';

type ApiTokenProvider = () => Promise<string>;
type CommandExecutor = (file: string, args: string[]) => Promise<string>;

interface DevProxyInstanceStatus {
  pid?: number;
  apiUrl?: string;
}

interface DevProxyApiToken {
  token?: string;
}

export async function getDevProxyApiToken(
  devProxyExe: string,
  apiPort: number,
  execute: CommandExecutor = executeFile
): Promise<string> {
  const statusOutput = await execute(devProxyExe, ['status', '--output', 'json']);
  const instance = statusOutput
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line) as DevProxyInstanceStatus;
      } catch {
        return undefined;
      }
    })
    .find(status => {
      if (typeof status?.pid !== 'number' || !status.apiUrl) {
        return false;
      }

      try {
        return new URL(status.apiUrl).port === apiPort.toString();
      } catch {
        return false;
      }
    });

  if (typeof instance?.pid !== 'number') {
    throw new Error(`No running Dev Proxy instance found on API port ${apiPort}`);
  }

  const tokenOutput = await execute(devProxyExe, [
    'api',
    'token',
    '--pid',
    instance.pid.toString(),
    '--output',
    'json',
  ]);
  const tokenResult = JSON.parse(tokenOutput.trim()) as DevProxyApiToken;
  const token = tokenResult.token?.trim();

  if (!token || !/^[0-9a-f]{64}$/i.test(token)) {
    throw new Error('Dev Proxy returned an invalid API token');
  }

  return token;
}

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
  private readonly tokenProvider?: ApiTokenProvider;
  private token?: string;

  constructor(port: number, timeout = 5000, tokenProvider?: ApiTokenProvider) {
    this.baseUrl = `http://localhost:${port}`;
    this.timeout = timeout;
    this.tokenProvider = tokenProvider;
  }

  /**
   * Create a client using the configured API port from VS Code settings.
   */
  static fromConfiguration(): DevProxyApiClient {
    const config = vscode.workspace.getConfiguration('dev-proxy-toolkit');
    const port = config.get<number>('apiPort', 8897);
    const versionPreference = config.get('version') as VersionPreference;
    const devProxyExe = getDevProxyExe(versionPreference);
    return new DevProxyApiClient(port, 5000, () => getDevProxyApiToken(devProxyExe, port));
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
    } catch (error) {
      logger.debug('Dev Proxy API unreachable', error);
      return false;
    }
  }

  /**
   * Stop the proxy.
   */
  async stop(): Promise<void> {
    logger.debug('Stopping Dev Proxy');
    await this.post('/proxy/stopproxy');
  }

  /**
   * Raise a mock request.
   */
  async raiseMockRequest(): Promise<void> {
    logger.debug('Raising mock request');
    await this.post('/proxy/mockrequest');
  }

  /**
   * Start recording API requests.
   */
  async startRecording(): Promise<void> {
    logger.debug('Starting recording');
    await this.post('/proxy', { recording: true });
  }

  /**
   * Stop recording API requests.
   */
  async stopRecording(): Promise<void> {
    logger.debug('Stopping recording');
    await this.post('/proxy', { recording: false });
  }

  /**
   * Get the current proxy status.
   */
  async getStatus(): Promise<ProxyStatus | null> {
    try {
      const response = await this.request('/proxy', {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!response.ok) {
        logger.debug('Failed to get proxy status', { status: response.status });
        return null;
      }
      return (await response.json()) as ProxyStatus;
    } catch (error) {
      logger.debug('Failed to get proxy status', error);
      return null;
    }
  }

  private async post(endpoint: string, body?: object): Promise<Response> {
    const response = await this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Dev Proxy API request failed: ${response.status} ${response.statusText}`);
    }
    return response;
  }

  private async request(endpoint: string, options: RequestInit): Promise<Response> {
    let response = await fetch(`${this.baseUrl}${endpoint}`, this.withAuthorization(options));
    if (response.status !== 401 || !this.tokenProvider) {
      return response;
    }

    this.token = await this.tokenProvider();
    response = await fetch(`${this.baseUrl}${endpoint}`, this.withAuthorization(options));
    return response;
  }

  private withAuthorization(options: RequestInit): RequestInit {
    if (!this.token) {
      return options;
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.token}`);
    return { ...options, headers };
  }
}

/**
 * Proxy status returned from the API.
 */
export interface ProxyStatus {
  recording?: boolean;
  // Add other status properties as they become known
}
