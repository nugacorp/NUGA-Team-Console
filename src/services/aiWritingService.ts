import { getApiCsrfToken } from '../auth/apiCsrf';

export type WritingContext = 'project_objective' | 'campaign_objective' | 'admin_notes';

export async function requestWritingSuggestion(input: {
  context: WritingContext;
  draft: string;
  title?: string;
  category?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const mode = import.meta.env.VITE_APP_MODE || 'demo';
  if (mode === 'demo') throw new Error('La asistencia real no está disponible en DEMO.');

  const response = await fetch('/api/v1/ai/writing-assist', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    signal: input.signal,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-nuga-mode': mode,
      'x-csrf-token': getApiCsrfToken()
    },
    body: JSON.stringify({
      context: input.context,
      draft: input.draft,
      title: input.title,
      category: input.category
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message || `La asistencia respondió HTTP ${response.status}.`);
  }
  const payload = await response.json() as { suggestion?: unknown };
  if (typeof payload.suggestion !== 'string' || payload.suggestion.trim().length < 3) {
    throw new Error('La asistencia no devolvió una sugerencia válida.');
  }
  return payload.suggestion.trim();
}
