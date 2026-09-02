import { getApiCsrfToken } from '../auth/apiCsrf';
import { WorkflowPlan, WorkflowResourceType } from '../types';

async function request(path: string, init?: RequestInit): Promise<WorkflowPlan | null> {
  const method = init?.method ?? 'GET';
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Nuga-Mode': import.meta.env.VITE_APP_MODE ?? 'production',
      ...(method !== 'GET' ? { 'X-CSRF-Token': getApiCsrfToken() ?? '' } : {}),
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const path = (type: WorkflowResourceType, id: string) =>
  `/api/v1/workflow-plans/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;

export const workflowService = {
  get: (type: WorkflowResourceType, id: string) => request(path(type, id)),
  answer: (type: WorkflowResourceType, id: string, questionId: string, answer: string) => request(`${path(type, id)}/answer`, { method: 'POST', body: JSON.stringify({ questionId, answer }) }),
  decide: (type: WorkflowResourceType, id: string, action: 'approve' | 'reject', note = '') => request(`${path(type, id)}/decision`, { method: 'POST', body: JSON.stringify({ action, note }) })
};
