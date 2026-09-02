export type WritingContext = 'project_objective' | 'campaign_objective' | 'admin_notes';

export interface WritingSuggestionRequest {
  context: WritingContext;
  draft: string;
  title?: string;
  category?: string;
}

export interface MiniMaxWritingAdapterOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
}

export class MiniMaxWritingError extends Error {
  constructor(
    public readonly code: 'UNAVAILABLE' | 'INVALID_RESPONSE',
    message: string
  ) {
    super(message);
    this.name = 'MiniMaxWritingError';
  }
}

const contextLabels: Record<WritingContext, string> = {
  project_objective: 'objetivo verificable de un proyecto',
  campaign_objective: 'objetivo estratégico de una campaña de marketing',
  admin_notes: 'notas claras de un registro administrativo'
};

function cleanSuggestion(value: string): string {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:text)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()
    .slice(0, 1_500);
}

export class MiniMaxWritingAdapter {
  constructor(
    private readonly options: MiniMaxWritingAdapterOptions,
    private readonly request: typeof fetch = fetch
  ) {}

  async improve(input: WritingSuggestionRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
    let response: Response;

    try {
      response = await this.request(
        new URL('/v1/chat/completions', this.options.baseUrl),
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            authorization: `Bearer ${this.options.apiKey}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: this.options.model,
            messages: [
              {
                role: 'system',
                content: [
                  'Eres un editor profesional en español para NUGA Team Console.',
                  'Mejora claridad, estructura, precisión y verificabilidad.',
                  'Conserva estrictamente los hechos proporcionados.',
                  'No inventes nombres, cifras, fechas, presupuestos, clientes, métricas ni resultados.',
                  'Devuelve únicamente el texto mejorado, sin explicación, encabezados ni comillas.'
                ].join(' ')
              },
              {
                role: 'user',
                content: [
                  `Tipo: ${contextLabels[input.context]}.`,
                  input.title ? `Título: ${input.title}.` : '',
                  input.category ? `Categoría: ${input.category}.` : '',
                  `Borrador: ${input.draft}`
                ].filter(Boolean).join('\n')
              }
            ],
            temperature: 0.3,
            max_completion_tokens: 350,
            reasoning_split: true,
            stream: false
          })
        }
      );
    } catch {
      throw new MiniMaxWritingError('UNAVAILABLE', 'MiniMax no está disponible.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new MiniMaxWritingError('UNAVAILABLE', `MiniMax respondió HTTP ${response.status}.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax devolvió JSON inválido.');
    }

    const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })
      .choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax no devolvió texto.');
    }

    const suggestion = cleanSuggestion(content);
    if (suggestion.length < 3) {
      throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax devolvió una sugerencia vacía.');
    }
    return suggestion;
  }
}
