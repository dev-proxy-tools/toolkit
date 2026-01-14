/**
 * Task Provider tests.
 * Tests for DevProxyTaskProvider.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { DevProxyTaskProvider, registerTaskProvider } from '../task-provider';
import { getExtensionContext } from './helpers';

suite('DevProxyTaskProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;

  setup(async () => {
    sandbox = sinon.createSandbox();
    mockContext = await getExtensionContext();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('constructor', () => {
    test('should create provider with extension context', () => {
      const provider = new DevProxyTaskProvider(mockContext);
      assert.ok(provider);
    });
  });

  suite('provideTasks', () => {
    test('should return array of tasks', async () => {
      const provider = new DevProxyTaskProvider(mockContext);
      const tasks = await provider.provideTasks();

      assert.ok(Array.isArray(tasks), 'Should return an array');
      assert.strictEqual(tasks!.length, 2, 'Should return start and stop tasks');
    });

    test('should include start task', async () => {
      const provider = new DevProxyTaskProvider(mockContext);
      const tasks = await provider.provideTasks();

      const startTask = tasks!.find(t => t.name.includes('Start'));
      assert.ok(startTask, 'Should include a start task');
    });

    test('should include stop task', async () => {
      const provider = new DevProxyTaskProvider(mockContext);
      const tasks = await provider.provideTasks();

      const stopTask = tasks!.find(t => t.name.includes('Stop'));
      assert.ok(stopTask, 'Should include a stop task');
    });
  });

  suite('resolveTask', () => {
    test('should resolve devproxy start task', () => {
      const provider = new DevProxyTaskProvider(mockContext);

      const taskDefinition = {
        type: 'devproxy',
        command: 'start' as const,
        label: 'Start Dev Proxy',
      };

      const mockTask = new vscode.Task(
        taskDefinition,
        vscode.TaskScope.Workspace,
        'Start Dev Proxy',
        'devproxy'
      );

      const resolved = provider.resolveTask(mockTask);

      assert.ok(resolved, 'Should resolve the task');
      assert.ok(resolved instanceof vscode.Task, 'Should return a Task');
    });

    test('should resolve devproxy stop task', () => {
      const provider = new DevProxyTaskProvider(mockContext);

      const taskDefinition = {
        type: 'devproxy',
        command: 'stop' as const,
        label: 'Stop Dev Proxy',
      };

      const mockTask = new vscode.Task(
        taskDefinition,
        vscode.TaskScope.Workspace,
        'Stop Dev Proxy',
        'devproxy'
      );

      const resolved = provider.resolveTask(mockTask);

      assert.ok(resolved, 'Should resolve the task');
    });

    test('should return undefined for non-devproxy task', () => {
      const provider = new DevProxyTaskProvider(mockContext);

      const taskDefinition = {
        type: 'shell',
        command: 'echo test',
      };

      const mockTask = new vscode.Task(
        taskDefinition,
        vscode.TaskScope.Workspace,
        'Echo Test',
        'shell'
      );

      const resolved = provider.resolveTask(mockTask);

      assert.strictEqual(resolved, undefined, 'Should return undefined for non-devproxy task');
    });

    test('should handle configFile in definition', () => {
      const provider = new DevProxyTaskProvider(mockContext);

      const taskDefinition = {
        type: 'devproxy',
        command: 'start' as const,
        configFile: 'custom-config.json',
        label: 'Start with Config',
      };

      const mockTask = new vscode.Task(
        taskDefinition,
        vscode.TaskScope.Workspace,
        'Start with Config',
        'devproxy'
      );

      const resolved = provider.resolveTask(mockTask);

      assert.ok(resolved, 'Should resolve task with configFile');
    });

    test('should handle additional args in definition', () => {
      const provider = new DevProxyTaskProvider(mockContext);

      const taskDefinition = {
        type: 'devproxy',
        command: 'start' as const,
        args: ['--port', '8080'],
        label: 'Start with Args',
      };

      const mockTask = new vscode.Task(
        taskDefinition,
        vscode.TaskScope.Workspace,
        'Start with Args',
        'devproxy'
      );

      const resolved = provider.resolveTask(mockTask);

      assert.ok(resolved, 'Should resolve task with args');
    });
  });

  suite('task properties', () => {
    test('start task should be background task', async () => {
      const provider = new DevProxyTaskProvider(mockContext);
      const tasks = await provider.provideTasks();

      const startTask = tasks!.find(t => t.name.includes('Start'));
      assert.strictEqual(startTask?.isBackground, true, 'Start task should be background');
    });

    test('start task should be in build group', async () => {
      const provider = new DevProxyTaskProvider(mockContext);
      const tasks = await provider.provideTasks();

      const startTask = tasks!.find(t => t.name.includes('Start'));
      assert.strictEqual(startTask?.group, vscode.TaskGroup.Build, 'Start task should be in build group');
    });

    test('stop task should be in build group', async () => {
      const provider = new DevProxyTaskProvider(mockContext);
      const tasks = await provider.provideTasks();

      const stopTask = tasks!.find(t => t.name.includes('Stop'));
      assert.strictEqual(stopTask?.group, vscode.TaskGroup.Build, 'Stop task should be in build group');
    });
  });
});

suite('registerTaskProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;

  setup(async () => {
    sandbox = sinon.createSandbox();
    mockContext = await getExtensionContext();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should register task provider with correct type', () => {
    const registerStub = sandbox.stub(vscode.tasks, 'registerTaskProvider').returns({
      dispose: () => {},
    } as vscode.Disposable);

    registerTaskProvider(mockContext);

    assert.ok(registerStub.calledOnce, 'Should register task provider');
    assert.strictEqual(
      registerStub.firstCall.args[0],
      'devproxy',
      'Should register with devproxy type'
    );
  });

  test('should add subscription to context', () => {
    sandbox.stub(vscode.tasks, 'registerTaskProvider').returns({
      dispose: () => {},
    } as vscode.Disposable);

    const initialLength = mockContext.subscriptions.length;
    registerTaskProvider(mockContext);

    assert.strictEqual(
      mockContext.subscriptions.length,
      initialLength + 1,
      'Should add one subscription'
    );
  });
});
