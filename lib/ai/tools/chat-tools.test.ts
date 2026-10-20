import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterEach, test } from 'node:test';
import { streamText } from 'ai';
import { MockLanguageModelV1, simulateReadableStream } from 'ai/test';
import { createChatTools } from './chat-tools';
import { financialTools } from './financial-tools';
import type { createWebResearchTools } from './web-research';

const originalFetch = globalThis.fetch;
const originalEnabled = process.env.WEB_SEARCH_ENABLED;
const originalParallelKey = process.env.PARALLEL_API_KEY;
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries({
    WEB_SEARCH_ENABLED: originalEnabled,
    PARALLEL_API_KEY: originalParallelKey,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function chatTools(chatId: string = randomUUID(), abortSignal?: AbortSignal) {
  return createChatTools({
    chatId, abortSignal, financialDatasetsApiKey: 'financial-secret',
    dataStream: { writeData() {} },
  });
}

type RpcRequest = {
  id?: number;
  method: string;
  params?: { name: string; arguments: Record<string, unknown> };
};

function mockMcp(onCall?: (request: RpcRequest, signal: AbortSignal) => Promise<unknown>) {
  const requests: RpcRequest[] = [];
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://search.parallel.ai/mcp');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('User-Agent'),
      'ai-financial-agent/0.1.0 (+https://github.com/virattt/ai-financial-agent)');
    assert.equal(headers.get('Authorization'), null);
    assert.equal(headers.get('X-API-Key'), null);
    assert.ok(init?.signal);
    assert.equal(init.redirect, 'error');
    if (init.method === 'GET') return new Response(null, { status: 405 });
    const request = JSON.parse(String(init.body)) as RpcRequest;
    requests.push(request);
    if (request.id === undefined) return new Response(null, { status: 202 });
    let result: unknown;
    if (request.method === 'initialize') {
      result = {
        protocolVersion: '2025-03-26', capabilities: { tools: {} },
        serverInfo: { name: 'test-mcp', version: '1' },
      };
    } else if (request.method === 'tools/list') {
      result = { tools: ['web_search', 'web_fetch'].map((name) => ({
        name, inputSchema: { type: 'object' },
      })) };
    } else {
      assert.equal(request.method, 'tools/call');
      result = onCall ? await onCall(request, init.signal) : {
        content: [{ type: 'text', text: 'Company source: https://example.com/report' }],
      };
    }
    return Response.json({ jsonrpc: '2.0', id: request.id, result });
  };
  return requests;
}

function enabledTools(chatId: string = randomUUID(), signal?: AbortSignal) {
  // biome-ignore lint/performance/noDelete: assigning undefined to process.env creates the string "undefined".
  delete process.env.WEB_SEARCH_ENABLED;
  const tools = chatTools(chatId, signal);
  assert.ok('web_search' in tools);
  assert.ok('web_fetch' in tools);
  return tools as ReturnType<typeof createChatTools> & ReturnType<typeof createWebResearchTools>;
}

test('unconfigured chat streams search and fetch results through the AI SDK tool loop', async () => {
  process.env.PARALLEL_API_KEY = 'ambient-secret-must-not-be-forwarded';
  const requests = mockMcp();
  const chatId = randomUUID();
  const tools = enabledTools(chatId);
  for (const name of financialTools) assert.ok(name in tools);
  let step = 0;
  const model = new MockLanguageModelV1({
    doStream: async ({ prompt }) => {
      if (step > 0) {
        // This assertion observes the result the next model step actually sees.
        assert.match(JSON.stringify(prompt), /https:\/\/example.com\/report/);
      }
      const chunks = step < 2 ? [{
        type: 'tool-call' as const, toolCallType: 'function' as const,
        toolCallId: `call-${step}`,
        toolName: step === 0 ? 'web_search' : 'web_fetch',
        args: JSON.stringify(step === 0
          ? { objective: 'Company developments', search_queries: ['company recent developments'] }
          : { urls: ['https://example.com/report'], objective: 'Read the source' }),
      }] : [{ type: 'text-delta' as const, textDelta: 'Source: https://example.com/report' }];
      const finishReason = step++ < 2 ? 'tool-calls' as const : 'stop' as const;
      return {
        stream: simulateReadableStream({ chunks: [...chunks, {
          type: 'finish' as const, finishReason,
          usage: { promptTokens: 1, completionTokens: 1 },
        }] }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    },
  });
  const result = streamText({ model, tools, prompt: 'Research this company', maxSteps: 3 });
  let text = '';
  for await (const chunk of result.textStream) text += chunk;
  assert.equal(text, 'Source: https://example.com/report');
  assert.equal((await result.steps).length, 3);
  const calls = requests.filter((r) => r.method === 'tools/call');
  assert.deepEqual(calls.map((r) => r.params?.name), ['web_search', 'web_fetch']);
  assert.ok(calls.every((r) => r.params?.arguments.session_id === chatId));
  assert.equal(requests.filter((r) => r.method === 'tools/list').length, 2);
});

test('follow-ups and interleaved chats retain their own IDs, and new chat resets identity', async () => {
  const requests = mockMcp();
  const firstId = randomUUID();
  const secondId = randomUUID();
  const first = enabledTools(firstId);
  const second = enabledTools(secondId);
  await Promise.all([
    first.web_search.execute({ objective: 'First', search_queries: ['first query'] }),
    second.web_search.execute({ objective: 'Second', search_queries: ['second query'] }),
  ]);
  await first.web_fetch.execute({ urls: ['https://example.com/report'] });
  // A subsequent POST constructs a new resolver for the existing chat UUID.
  await enabledTools(firstId).web_search.execute({ objective: 'Follow-up', search_queries: ['follow up query'] });
  await enabledTools().web_search.execute({ objective: 'New chat', search_queries: ['new query'] });
  const calls = requests.filter((r) => r.method === 'tools/call');
  const ids = calls.map((r) => r.params?.arguments.session_id);
  assert.deepEqual(ids.slice(0, 4), [firstId, secondId, firstId, firstId]);
  assert.notEqual(ids[4], firstId);
  assert.notEqual(ids[4], secondId);
});

test('explicit disable removes web tools and retains financial credentials', async () => {
  process.env.WEB_SEARCH_ENABLED = 'false';
  const requests: string[] = [];
  globalThis.fetch = async (url, init) => {
    requests.push(String(url));
    assert.equal(new Headers(init?.headers).get('X-API-Key'), 'financial-secret');
    return Response.json({ news: [] });
  };
  const tools = chatTools();
  assert.deepEqual(Object.keys(tools).sort(), [...financialTools].sort());
  assert.ok(!('web_search' in tools));
  assert.ok(!('web_fetch' in tools));
  await tools.getNews.execute({ ticker: 'AAPL' });
  assert.equal(requests.length, 1);
  assert.match(requests[0], /^https:\/\/api.financialdatasets.ai\/news\//);
});

test('validates fetch URLs and opaque conversation IDs before execution', () => {
  const tools = enabledTools();
  for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'https://user:secret@example.com']) {
    assert.equal(tools.web_fetch.parameters.safeParse({ urls: [url] }).success, false);
  }
  assert.equal(tools.web_fetch.parameters.safeParse({ urls: ['https://example.com/a?b=c'] }).success, true);
  assert.throws(() => chatTools('user@example.com'));
});

test('MCP tool errors and network errors surface without fallback or rotating chat IDs', async () => {
  const chatId = randomUUID();
  const requests = mockMcp(async () => ({ isError: true, content: [{ type: 'text', text: 'Quota exceeded' }] }));
  const tools = enabledTools(chatId);
  for (let i = 0; i < 2; i++) {
    assert.match(JSON.stringify(await tools.web_search.execute({ objective: 'Research', search_queries: ['query'] })), /unavailable/);
  }
  assert.ok(requests.filter((r) => r.method === 'tools/call')
    .every((r) => r.params?.arguments.session_id === chatId));
  globalThis.fetch = async () => { throw new Error('Connection failed'); };
  assert.match(JSON.stringify(await tools.web_fetch.execute({ urls: ['https://example.com'] })), /unavailable/);
});

test('cancels in-flight requests and respects a chat stopped before execution', async () => {
  const controller = new AbortController();
  let started!: () => void;
  const ready = new Promise<void>((resolve) => { started = resolve; });
  mockMcp(async (_request, signal) => new Promise((_resolve, reject) => {
    started();
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const tools = enabledTools(randomUUID(), controller.signal);
  const pending = tools.web_search.execute({ objective: 'Research', search_queries: ['query'] });
  await ready;
  controller.abort(new DOMException('Stopped', 'AbortError'));
  await assert.rejects(pending, { name: 'AbortError' });
  globalThis.fetch = async () => { assert.fail('Stopped chats cannot make requests'); };
  await assert.rejects(tools.web_fetch.execute({ urls: ['https://example.com'] }), { name: 'AbortError' });
});

test('one deadline covers stalled HTTP requests', async () => {
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    const keepAlive = setTimeout(() => reject(new Error('Deadline did not abort')), 17_000);
    init?.signal?.addEventListener('abort', () => {
      clearTimeout(keepAlive);
      reject(init.signal?.reason);
    }, { once: true });
  });
  const result = await enabledTools().web_search.execute({ objective: 'Research', search_queries: ['query'] });
  assert.match(JSON.stringify(result), /timed out/);
});
