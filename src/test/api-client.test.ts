/**
 * API Client tests.
 * Tests for DevProxyApiClient using sinon stubs for fetch.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import { DevProxyApiClient } from '../services/api-client';

suite('DevProxyApiClient', () => {
  let client: DevProxyApiClient;
  let fetchStub: sinon.SinonStub;

  setup(() => {
    client = new DevProxyApiClient(8897);
    fetchStub = sinon.stub(global, 'fetch');
  });

  teardown(() => {
    fetchStub.restore();
  });

  suite('constructor', () => {
    test('should create client with specified port', () => {
      const customClient = new DevProxyApiClient(9999);
      // Client is created successfully - we verify by making a call
      fetchStub.resolves(new Response(null, { status: 200 }));
      // No assertion needed - just verifying it doesn't throw
      assert.ok(customClient);
    });

    test('should use default timeout', () => {
      const customClient = new DevProxyApiClient(8897);
      assert.ok(customClient);
    });

    test('should accept custom timeout', () => {
      const customClient = new DevProxyApiClient(8897, 10000);
      assert.ok(customClient);
    });
  });

  suite('isRunning', () => {
    test('should return true when proxy responds with 2xx', async () => {
      fetchStub.resolves(new Response(null, { status: 200 }));

      const result = await client.isRunning();

      assert.strictEqual(result, true);
      assert.ok(fetchStub.calledOnce);
      assert.ok(fetchStub.firstCall.args[0].includes('/proxy'));
    });

    test('should return true when proxy responds with 4xx', async () => {
      // 4xx still means proxy is running, just rejecting the request
      fetchStub.resolves(new Response(null, { status: 400 }));

      const result = await client.isRunning();

      assert.strictEqual(result, true);
    });

    test('should return false when proxy responds with 5xx', async () => {
      fetchStub.resolves(new Response(null, { status: 500 }));

      const result = await client.isRunning();

      assert.strictEqual(result, false);
    });

    test('should return false when fetch throws', async () => {
      fetchStub.rejects(new Error('Connection refused'));

      const result = await client.isRunning();

      assert.strictEqual(result, false);
    });
  });

  suite('stop', () => {
    test('should POST to /proxy/stopproxy', async () => {
      fetchStub.resolves(new Response(null, { status: 200 }));

      await client.stop();

      assert.ok(fetchStub.calledOnce);
      const [url, options] = fetchStub.firstCall.args;
      assert.ok(url.includes('/proxy/stopproxy'));
      assert.strictEqual(options.method, 'POST');
    });
  });

  suite('raiseMockRequest', () => {
    test('should POST to /proxy/mockrequest', async () => {
      fetchStub.resolves(new Response(null, { status: 200 }));

      await client.raiseMockRequest();

      assert.ok(fetchStub.calledOnce);
      const [url, options] = fetchStub.firstCall.args;
      assert.ok(url.includes('/proxy/mockrequest'));
      assert.strictEqual(options.method, 'POST');
    });
  });

  suite('startRecording', () => {
    test('should POST to /proxy with recording: true', async () => {
      fetchStub.resolves(new Response(null, { status: 200 }));

      await client.startRecording();

      assert.ok(fetchStub.calledOnce);
      const [url, options] = fetchStub.firstCall.args;
      assert.ok(url.includes('/proxy'));
      assert.strictEqual(options.method, 'POST');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');
      assert.strictEqual(options.body, JSON.stringify({ recording: true }));
    });
  });

  suite('stopRecording', () => {
    test('should POST to /proxy with recording: false', async () => {
      fetchStub.resolves(new Response(null, { status: 200 }));

      await client.stopRecording();

      assert.ok(fetchStub.calledOnce);
      const [url, options] = fetchStub.firstCall.args;
      assert.ok(url.includes('/proxy'));
      assert.strictEqual(options.method, 'POST');
      assert.strictEqual(options.body, JSON.stringify({ recording: false }));
    });
  });

  suite('getStatus', () => {
    test('should return status when proxy responds with 200', async () => {
      const statusData = { recording: true };
      fetchStub.resolves(
        new Response(JSON.stringify(statusData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.getStatus();

      assert.deepStrictEqual(result, statusData);
    });

    test('should return null when proxy responds with error', async () => {
      fetchStub.resolves(new Response(null, { status: 500 }));

      const result = await client.getStatus();

      assert.strictEqual(result, null);
    });

    test('should return null when fetch throws', async () => {
      fetchStub.rejects(new Error('Connection refused'));

      const result = await client.getStatus();

      assert.strictEqual(result, null);
    });

    test('should return status with recording false', async () => {
      const statusData = { recording: false };
      fetchStub.resolves(
        new Response(JSON.stringify(statusData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.getStatus();

      assert.deepStrictEqual(result, statusData);
    });
  });

  suite('fromConfiguration', () => {
    test('should create client from VS Code configuration', () => {
      // This test just verifies the static factory method exists and returns a client
      const configClient = DevProxyApiClient.fromConfiguration();
      assert.ok(configClient instanceof DevProxyApiClient);
    });
  });
});
