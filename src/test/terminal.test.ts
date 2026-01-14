/**
 * Terminal Service tests.
 * Tests for TerminalService using sinon stubs for VS Code terminal API.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { TerminalService } from '../services/terminal';

suite('TerminalService', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('constructor', () => {
    test('should use default config values when no config provided', () => {
      const service = new TerminalService();
      assert.ok(service);
    });

    test('should accept custom config', () => {
      const service = new TerminalService({
        createNewTerminal: false,
        showTerminal: false,
        closeTerminalOnStop: false,
      });
      assert.ok(service);
    });

    test('should accept partial config', () => {
      const service = new TerminalService({
        createNewTerminal: false,
      });
      assert.ok(service);
    });
  });

  suite('fromConfiguration', () => {
    test('should create service from VS Code configuration', () => {
      const service = TerminalService.fromConfiguration();
      assert.ok(service instanceof TerminalService);
    });
  });

  suite('getOrCreateTerminal', () => {
    test('should create new terminal when createNewTerminal is true', () => {
      const mockTerminal = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        name: 'Dev Proxy',
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'createTerminal').returns(mockTerminal);

      const service = new TerminalService({ createNewTerminal: true, showTerminal: true });
      const terminal = service.getOrCreateTerminal();

      assert.strictEqual(terminal, mockTerminal);
      assert.ok((mockTerminal.show as sinon.SinonStub).calledOnce);
    });

    test('should reuse active terminal when createNewTerminal is false', () => {
      const activeTerminal = {
        name: 'Existing Terminal',
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'activeTerminal').value(activeTerminal);
      const createStub = sandbox.stub(vscode.window, 'createTerminal');

      const service = new TerminalService({ createNewTerminal: false });
      const terminal = service.getOrCreateTerminal();

      assert.strictEqual(terminal, activeTerminal);
      assert.ok(createStub.notCalled);
    });

    test('should create new terminal when createNewTerminal is false but no active terminal', () => {
      const mockTerminal = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        name: 'Dev Proxy',
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'activeTerminal').value(undefined);
      sandbox.stub(vscode.window, 'createTerminal').returns(mockTerminal);

      const service = new TerminalService({ createNewTerminal: false, showTerminal: true });
      const terminal = service.getOrCreateTerminal();

      assert.strictEqual(terminal, mockTerminal);
    });

    test('should hide terminal when showTerminal is false', () => {
      const mockTerminal = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        name: 'Dev Proxy',
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'createTerminal').returns(mockTerminal);

      const service = new TerminalService({ createNewTerminal: true, showTerminal: false });
      service.getOrCreateTerminal();

      assert.ok((mockTerminal.hide as sinon.SinonStub).calledOnce);
      assert.ok((mockTerminal.show as sinon.SinonStub).notCalled);
    });
  });

  suite('disposeDevProxyTerminals', () => {
    test('should dispose terminals named "Dev Proxy"', () => {
      const devProxyTerminal = {
        name: 'Dev Proxy',
        dispose: sandbox.stub(),
      } as unknown as vscode.Terminal;

      const otherTerminal = {
        name: 'Other Terminal',
        dispose: sandbox.stub(),
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'terminals').value([devProxyTerminal, otherTerminal]);

      const service = new TerminalService({ closeTerminalOnStop: true });
      service.disposeDevProxyTerminals();

      assert.ok((devProxyTerminal.dispose as sinon.SinonStub).calledOnce);
      assert.ok((otherTerminal.dispose as sinon.SinonStub).notCalled);
    });

    test('should not dispose any terminals when closeTerminalOnStop is false', () => {
      const devProxyTerminal = {
        name: 'Dev Proxy',
        dispose: sandbox.stub(),
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'terminals').value([devProxyTerminal]);

      const service = new TerminalService({ closeTerminalOnStop: false });
      service.disposeDevProxyTerminals();

      assert.ok((devProxyTerminal.dispose as sinon.SinonStub).notCalled);
    });

    test('should handle empty terminals array', () => {
      sandbox.stub(vscode.window, 'terminals').value([]);

      const service = new TerminalService({ closeTerminalOnStop: true });
      // Should not throw
      service.disposeDevProxyTerminals();
    });

    test('should dispose multiple Dev Proxy terminals', () => {
      const terminal1 = {
        name: 'Dev Proxy',
        dispose: sandbox.stub(),
      } as unknown as vscode.Terminal;

      const terminal2 = {
        name: 'Dev Proxy',
        dispose: sandbox.stub(),
      } as unknown as vscode.Terminal;

      sandbox.stub(vscode.window, 'terminals').value([terminal1, terminal2]);

      const service = new TerminalService({ closeTerminalOnStop: true });
      service.disposeDevProxyTerminals();

      assert.ok((terminal1.dispose as sinon.SinonStub).calledOnce);
      assert.ok((terminal2.dispose as sinon.SinonStub).calledOnce);
    });
  });

  suite('sendCommand', () => {
    test('should send command text to terminal', () => {
      const mockTerminal = {
        sendText: sandbox.stub(),
      } as unknown as vscode.Terminal;

      const service = new TerminalService();
      service.sendCommand(mockTerminal, 'devproxy --config-file config.json');

      assert.ok((mockTerminal.sendText as sinon.SinonStub).calledOnce);
      assert.ok(
        (mockTerminal.sendText as sinon.SinonStub).calledWith('devproxy --config-file config.json')
      );
    });
  });
});
