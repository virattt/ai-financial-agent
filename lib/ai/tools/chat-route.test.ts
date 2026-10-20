import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import { z } from 'zod';
import { createChatTools } from './chat-tools';

// Run the production route with infrastructure boundaries replaced. The resolver
// remains real; no database, model credential or live provider is needed.
function loadRoute({ authenticated = true, owner = 'user' } = {}) {
  const state: { tools?: ReturnType<typeof createChatTools>; modelId?: string; signal?: AbortSignal; writes: number } = { writes: 0 };
  let execute!: (stream: { writeData(): void }) => Promise<void>;
  const modules: Record<string, unknown> = {
    ai: {
      convertToCoreMessages: (messages: unknown) => messages,
      createDataStreamResponse: (options: { execute: typeof execute }) => {
        execute = options.execute;
        return new Response('stream');
      },
      generateObject: async () => ({ object: [{ task_name: 'Researching company context' }] }),
      streamText: (options: { tools: typeof state.tools; model: string; abortSignal: AbortSignal }) => {
        state.tools = options.tools;
        state.modelId = options.model;
        state.signal = options.abortSignal;
        return { mergeIntoDataStream() {} };
      },
    },
    zod: { z },
    '@/app/(auth)/auth': { auth: async () => authenticated ? { user: { id: 'user' } } : null },
    '@/lib/ai': { customModel: (id: string) => id },
    '@/lib/ai/models': { models: [{ id: 'chosen-model', apiIdentifier: 'chosen-provider-model' }] },
    '@/lib/ai/prompts': { systemPrompt: 'Research' },
    '@/lib/db/queries': {
      getChatById: async () => ({ userId: owner }),
      saveMessages: async () => { state.writes++; },
    },
    '@/lib/utils': { generateUUID: randomUUID, getMostRecentUserMessage: (messages: unknown[]) => messages[0] },
    '../../actions': {},
    'langsmith/vercel': {},
    '@/lib/ai/tools/chat-tools': { createChatTools },
  };
  const source = readFileSync('app/(chat)/api/chat/route.ts', 'utf8');
  const compiled = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  runInNewContext(compiled, {
    exports, require: (name: string) => {
      assert.ok(name in modules, `Unexpected route dependency: ${name}`);
      return modules[name];
    }, Response, console,
  });
  assert.ok(exports.POST);
  return { post: exports.POST, state, execute: () => execute({ writeData() {} }) };
}

function request(id: string = randomUUID()) {
  return new Request('https://example.com/api/chat', {
    method: 'POST', body: JSON.stringify({
      id, messages: [{ role: 'user', content: 'Company context' }],
      modelId: 'chosen-model', modelApiKey: 'model-secret', financialDatasetsApiKey: 'financial-secret',
    }),
  });
}

test('route denies unauthenticated and foreign-chat requests before creating tools or saving messages', async () => {
  for (const config of [{ authenticated: false }, { owner: 'someone-else' }]) {
    const route = loadRoute(config);
    assert.equal((await route.post(request())).status, 401);
    assert.equal(route.state.writes, 0);
    assert.equal(route.state.tools, undefined);
  }
});

test('route rejects non-UUID chat identity and preserves selected model and stop signal', async () => {
  const route = loadRoute();
  assert.equal((await route.post(request('user@example.com'))).status, 400);
  assert.equal(route.state.writes, 0);
  const req = request();
  assert.equal((await route.post(req)).status, 200);
  await route.execute();
  assert.ok(route.state.tools);
  assert.equal(route.state.modelId, 'chosen-provider-model');
  assert.equal(route.state.signal, req.signal);
});
