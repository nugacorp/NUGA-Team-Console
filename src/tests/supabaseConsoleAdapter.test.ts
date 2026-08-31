import { describe, expect, it, vi } from 'vitest';
import {
  SupabaseConsoleAdapter,
  SupabaseConsoleError,
  SupabaseFetch
} from '../../server/supabaseConsoleAdapter';

function adapterWith(request: SupabaseFetch) {
  return new SupabaseConsoleAdapter({
    url: 'https://project.supabase.co',
    secretKey: 'sb_secret_test-only-not-real',
    timeoutMs: 1_000,
    maxResponseBytes: 10_000
  }, request);
}

describe('Supabase server-only console adapter', () => {
  it('uses the private schema and secret key only as apikey', async () => {
    const request = vi.fn<SupabaseFetch>(async () =>
      new Response('[]', { status: 200 })
    );
    await adapterWith(request).list('decisions');

    const [, init] = request.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.apikey).toBe('sb_secret_test-only-not-real');
    expect(headers['accept-profile']).toBe('nuga_console');
    expect(headers.authorization).toBeUndefined();
  });

  it('never offers update or delete operations for audit events', () => {
    const adapter = adapterWith(vi.fn<SupabaseFetch>());
    expect('update' in adapter).toBe(false);
    expect('delete' in adapter).toBe(false);
  });

  it('validates Hermes identifiers before making a request', async () => {
    const request = vi.fn<SupabaseFetch>();
    expect(() =>
      adapterWith(request).getTaskExtension('../production', 'task-1')
    ).toThrow(SupabaseConsoleError);
    expect(request).not.toHaveBeenCalled();
  });

  it('fails closed without leaking the secret on upstream errors', async () => {
    const adapter = adapterWith(async () =>
      new Response(JSON.stringify({ message: 'internal detail' }), { status: 500 })
    );
    const error = await adapter.list('deliverables').catch(value => value);
    expect(error).toBeInstanceOf(SupabaseConsoleError);
    expect(String(error)).not.toContain('sb_secret_');
    expect(String(error)).not.toContain('internal detail');
  });

  it('rejects malformed response contracts', async () => {
    const adapter = adapterWith(async () =>
      new Response('{"unexpected":true}', { status: 200 })
    );
    await expect(adapter.list('audit_events')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE'
    });
  });

  it('rejects sensitive or unexpected fields before sending them upstream', async () => {
    const request = vi.fn<SupabaseFetch>();
    const adapter = adapterWith(request);

    expect(() => adapter.create('audit_events', {
      actor: 'owner:ramiro',
      details: { authorization: 'Bearer forbidden' }
    })).toThrow(SupabaseConsoleError);
    expect(() => adapter.create('decisions', {
      code: 'DEC-1',
      confirmationToken: 'forbidden'
    })).toThrow(SupabaseConsoleError);
    expect(request).not.toHaveBeenCalled();
  });
});
