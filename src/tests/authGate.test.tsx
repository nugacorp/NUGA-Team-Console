import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthGate } from '../auth/AuthGate';

describe('Production authentication gate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('submits production credentials and displays an authentication error', async () => {
    vi.stubEnv('VITE_APP_MODE', 'production');
    vi.stubEnv('VITE_NUGA_API_URL', '/api');
    const request = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } })
    );

    render(<AuthGate><div>Contenido protegido</div></AuthGate>);

    expect(await screen.findByText('Producción privada')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'incorrect-test-password' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1][0]).toBe('/api/v1/auth/login');
    expect(request.mock.calls[1][1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        username: 'ramiro',
        password: 'incorrect-test-password'
      })
    }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'credenciales son incorrectas'
    );
  });
});
