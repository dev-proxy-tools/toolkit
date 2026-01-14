import * as vscode from 'vscode';
import { Commands } from '../constants/commands';
import { executeCommand } from '../utils/shell';
import { getDevProxyExe } from '../detect';
import { VersionPreference } from '../enums';

/**
 * JWT (JSON Web Token) generation commands.
 */

export function registerJwtCommands(
  context: vscode.ExtensionContext,
  configuration: vscode.WorkspaceConfiguration
): void {
  const versionPreference = configuration.get('version') as VersionPreference;
  const devProxyExe = getDevProxyExe(versionPreference);

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.jwtCreate, () => createJwt(devProxyExe))
  );
}

/**
 * JWT creation parameters collected from user input.
 */
interface JwtParams {
  name: string;
  issuer: string;
  audiences: string[];
  roles: string[];
  scopes: string[];
  claims: string[];
  validFor: number;
}

async function createJwt(devProxyExe: string): Promise<void> {
  const params = await collectJwtParams();
  if (!params) {
    return; // User cancelled
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Generating JWT...',
      cancellable: false,
    },
    async () => {
      try {
        const command = buildJwtCommand(devProxyExe, params);
        const result = await executeCommand(command);
        const token = extractToken(result);
        await presentToken(token, command);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate JWT token: ${error}`);
      }
    }
  );
}

async function collectJwtParams(): Promise<JwtParams | undefined> {
  const name = await promptForInput({
    prompt: 'Enter the name of the user to create the token for',
    placeHolder: 'Dev Proxy',
    value: 'Dev Proxy',
    title: 'JWT Generation - User Name',
  });
  if (name === undefined) {
    return undefined;
  }

  const issuer = await promptForInput({
    prompt: 'Enter the issuer of the token',
    placeHolder: 'dev-proxy',
    value: 'dev-proxy',
    title: 'JWT Generation - Issuer',
  });
  if (issuer === undefined) {
    return undefined;
  }

  const audiencesStr = await promptForInput({
    prompt: 'Enter the audiences (comma-separated for multiple)',
    placeHolder: 'https://myserver.com',
    value: 'https://myserver.com',
    title: 'JWT Generation - Audiences',
  });
  if (audiencesStr === undefined) {
    return undefined;
  }

  const rolesStr = await promptForInput({
    prompt: 'Enter roles (comma-separated, leave empty for none)',
    placeHolder: 'admin,user',
    value: '',
    title: 'JWT Generation - Roles (Optional)',
  });
  if (rolesStr === undefined) {
    return undefined;
  }

  const scopesStr = await promptForInput({
    prompt: 'Enter scopes (comma-separated, leave empty for none)',
    placeHolder: 'read,write',
    value: '',
    title: 'JWT Generation - Scopes (Optional)',
  });
  if (scopesStr === undefined) {
    return undefined;
  }

  const claimsStr = await promptForInput({
    prompt: 'Enter custom claims in format name:value (comma-separated, leave empty for none)',
    placeHolder: 'custom:claim,department:engineering',
    value: '',
    title: 'JWT Generation - Custom Claims (Optional)',
  });
  if (claimsStr === undefined) {
    return undefined;
  }

  const validForStr = await promptForInput({
    prompt: 'Enter token validity duration in minutes',
    placeHolder: '60',
    value: '60',
    title: 'JWT Generation - Validity Duration',
    validateInput: (value: string) => {
      const num = parseInt(value);
      if (isNaN(num) || num <= 0) {
        return 'Please enter a positive number';
      }
      return undefined;
    },
  });
  if (validForStr === undefined) {
    return undefined;
  }

  return {
    name,
    issuer,
    audiences: parseList(audiencesStr),
    roles: parseList(rolesStr),
    scopes: parseList(scopesStr),
    claims: parseList(claimsStr).filter(c => c.includes(':')),
    validFor: parseInt(validForStr),
  };
}

function promptForInput(options: vscode.InputBoxOptions): Thenable<string | undefined> {
  return vscode.window.showInputBox(options);
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function buildJwtCommand(devProxyExe: string, params: JwtParams): string {
  let command = `${devProxyExe} jwt create --name "${params.name}" --issuer "${params.issuer}" --valid-for ${params.validFor}`;

  params.audiences.forEach(audience => {
    command += ` --audiences "${audience}"`;
  });

  params.roles.forEach(role => {
    command += ` --roles "${role}"`;
  });

  params.scopes.forEach(scope => {
    command += ` --scopes "${scope}"`;
  });

  params.claims.forEach(claim => {
    command += ` --claims "${claim}"`;
  });

  return command;
}

function extractToken(result: string): string {
  const lines = result.split('\n').filter(line => line.trim());
  return lines[lines.length - 1].trim();
}

async function presentToken(token: string, command: string): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    'JWT generated successfully!',
    { modal: true },
    'Copy to Clipboard',
    'Show Token'
  );

  if (choice === 'Copy to Clipboard') {
    await vscode.env.clipboard.writeText(token);
    vscode.window.showInformationMessage('JWT copied to clipboard');
  } else if (choice === 'Show Token') {
    const document = await vscode.workspace.openTextDocument({
      content: `JWT Generated: ${new Date().toISOString()}\n\nToken: ${token}\n\nCommand used:\n${command}`,
      language: 'plaintext',
    });
    await vscode.window.showTextDocument(document);
  }
}
