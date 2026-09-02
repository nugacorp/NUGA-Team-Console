import { describe, expect, it, vi } from 'vitest';
import { MiniMaxWritingAdapter, MiniMaxWritingError } from '../../server/miniMaxWritingAdapter';

describe('MiniMaxWritingAdapter', () => {
  it('sends a fact-preserving request and returns only the improved text', async () => {
    const request = vi.fn(async (_url: URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe('MiniMax-M2.7');
      expect(body.messages[0].content).toContain('No inventes');
      expect(body.messages[1].content).toContain('Borrador: mejorar cobertura en lomas');
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer secret-test-key');
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'Mejorar la cobertura en Lomas mediante acciones verificables.' } }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const adapter = new MiniMaxWritingAdapter({
      apiKey: 'secret-test-key', model: 'MiniMax-M2.7',
      baseUrl: 'https://api.minimax.io', timeoutMs: 1_000
    }, request as typeof fetch);

    await expect(adapter.improve({
      context: 'project_objective', draft: 'mejorar cobertura en lomas'
    })).resolves.toBe('Mejorar la cobertura en Lomas mediante acciones verificables.');
  });

  it('fails closed when the provider response has no suggestion', async () => {
    const adapter = new MiniMaxWritingAdapter({
      apiKey: 'secret-test-key', model: 'MiniMax-M2.7',
      baseUrl: 'https://api.minimax.io', timeoutMs: 1_000
    }, async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }));

    await expect(adapter.improve({ context: 'admin_notes', draft: 'registrar acuerdo real' }))
      .rejects.toMatchObject({ code: 'INVALID_RESPONSE' } satisfies Partial<MiniMaxWritingError>);
  });
});
