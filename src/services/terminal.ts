import * as vscode from 'vscode';

/**
 * Service for managing terminal instances used by Dev Proxy.
 *
 * Encapsulates the terminal creation logic and settings lookup,
 * making commands simpler and more testable.
 */
export class TerminalService {
  private readonly createNewTerminal: boolean;
  private readonly showTerminal: boolean;
  private readonly closeTerminalOnStop: boolean;

  constructor(config?: TerminalServiceConfig) {
    this.createNewTerminal = config?.createNewTerminal ?? true;
    this.showTerminal = config?.showTerminal ?? true;
    this.closeTerminalOnStop = config?.closeTerminalOnStop ?? true;
  }

  /**
   * Create a TerminalService using VS Code configuration.
   */
  static fromConfiguration(): TerminalService {
    const config = vscode.workspace.getConfiguration('dev-proxy-toolkit');
    return new TerminalService({
      createNewTerminal: config.get<boolean>('newTerminal', true),
      showTerminal: config.get<boolean>('showTerminal', true),
      closeTerminalOnStop: config.get<boolean>('closeTerminal', true),
    });
  }

  /**
   * Get or create a terminal for running Dev Proxy.
   *
   * Behavior depends on configuration:
   * - If newTerminal is false and there's an active terminal, reuse it
   * - Otherwise, create a new terminal named "Dev Proxy"
   */
  getOrCreateTerminal(): vscode.Terminal {
    if (!this.createNewTerminal && vscode.window.activeTerminal) {
      return vscode.window.activeTerminal;
    }

    const terminal = vscode.window.createTerminal('Dev Proxy');

    if (this.showTerminal) {
      terminal.show();
    } else {
      terminal.hide();
    }

    return terminal;
  }

  /**
   * Find and dispose all terminals named "Dev Proxy".
   */
  disposeDevProxyTerminals(): void {
    if (!this.closeTerminalOnStop) {
      return;
    }

    vscode.window.terminals.forEach(terminal => {
      if (terminal.name === 'Dev Proxy') {
        terminal.dispose();
      }
    });
  }

  /**
   * Send a command to a terminal.
   */
  sendCommand(terminal: vscode.Terminal, command: string): void {
    terminal.sendText(command);
  }
}

export interface TerminalServiceConfig {
  createNewTerminal?: boolean;
  showTerminal?: boolean;
  closeTerminalOnStop?: boolean;
}
