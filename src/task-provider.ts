import * as vscode from 'vscode';
import { getDevProxyExe } from './detect';
import { VersionPreference } from './enums';

interface DevProxyTaskDefinition extends vscode.TaskDefinition {
    type: 'devproxy';
    command: 'start' | 'stop';
    configFile?: string;
    args?: string[];
    label?: string;
}

export class DevProxyTaskProvider implements vscode.TaskProvider {
    static DevProxyType = 'devproxy';
    private devProxyExe: string;

    constructor(private context: vscode.ExtensionContext) {
        const configuration = vscode.workspace.getConfiguration('dev-proxy-toolkit');
        const versionPreference = configuration.get('version') as VersionPreference;
        this.devProxyExe = getDevProxyExe(versionPreference);
    }

    provideTasks(): Thenable<vscode.Task[]> | undefined {
        return this.getDevProxyTasks();
    }

    resolveTask(task: vscode.Task): vscode.Task | undefined {
        const definition = task.definition as DevProxyTaskDefinition;
        
        if (definition.type !== DevProxyTaskProvider.DevProxyType) {
            return undefined;
        }

        return this.createTaskFromDefinition(definition);
    }

    private async getDevProxyTasks(): Promise<vscode.Task[]> {
        const tasks: vscode.Task[] = [];

        tasks.push(this.createStartTask());
        tasks.push(this.createStopTask());

        return tasks;
    }

    private createStartTask(): vscode.Task {
        const definition: DevProxyTaskDefinition = {
            type: 'devproxy',
            command: 'start',
            label: 'Start Dev Proxy'
        };

        return this.createTaskFromDefinition(definition);
    }

    private createStopTask(): vscode.Task {
        const definition: DevProxyTaskDefinition = {
            type: 'devproxy',
            command: 'stop',
            label: 'Stop Dev Proxy'
        };

        return this.createTaskFromDefinition(definition);
    }

    private createTaskFromDefinition(definition: DevProxyTaskDefinition): vscode.Task {
        let execution: vscode.ShellExecution;

        if (definition.command === 'start') {
            const args = this.buildArgumentsFromDefinition(definition);
            execution = new vscode.ShellExecution(this.devProxyExe, args, {
                cwd: '${workspaceFolder}'
            });
        } else if (definition.command === 'stop') {
            // Use curl to stop Dev Proxy via API
            const configuration = vscode.workspace.getConfiguration('dev-proxy-toolkit');
            const apiPort = configuration.get('apiPort', 8897);
            execution = new vscode.ShellExecution('curl', [
                '-X', 'POST',
                `http://localhost:${apiPort}/proxy/stopproxy`
            ]);
        } else {
            throw new Error(`Unsupported command: ${definition.command}`);
        }

        const task = new vscode.Task(
            definition,
            vscode.TaskScope.Workspace,
            definition.label || `Dev Proxy: ${definition.command}`,
            DevProxyTaskProvider.DevProxyType,
            execution,
            definition.command === 'start' ? ['$devproxy-watch'] : []
        );

        // Configure task properties based on command
        if (definition.command === 'start') {
            task.group = vscode.TaskGroup.Build;
            task.isBackground = true;
            task.presentationOptions = {
                echo: true,
                reveal: vscode.TaskRevealKind.Always,
                focus: false,
                panel: vscode.TaskPanelKind.Dedicated,
                showReuseMessage: true,
                clear: false
            };
        } else if (definition.command === 'stop') {
            task.group = vscode.TaskGroup.Build;
            task.presentationOptions = {
                echo: false,
                reveal: vscode.TaskRevealKind.Silent,
                focus: false
            };
        }

        return task;
    }

    private buildArgumentsFromDefinition(definition: DevProxyTaskDefinition): string[] {
        const args: string[] = [];

        // Handle specific properties
        if (definition.configFile) {
            args.push('--config-file', definition.configFile);
        }

        // Add any additional args
        if (definition.args) {
            args.push(...definition.args);
        }

        return args;
    }
}

export const registerTaskProvider = (context: vscode.ExtensionContext) => {
    const provider = new DevProxyTaskProvider(context);
    context.subscriptions.push(
        vscode.tasks.registerTaskProvider(DevProxyTaskProvider.DevProxyType, provider)
    );
};
