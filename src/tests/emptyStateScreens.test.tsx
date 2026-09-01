import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipoIAScreen } from '../components/screens/EquipoIAScreen';
import { OperacionesWispScreen } from '../components/screens/OperacionesWispScreen';
import { useApp } from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn()
}));

const mockedUseApp = vi.mocked(useApp);

describe('Production screens with disconnected data sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Operaciones WISP safely when MikroTik has no routers', () => {
    mockedUseApp.mockReturnValue({
      towers: [],
      routers: [],
      links: [],
      incidents: [],
      selectedRouterId: null,
      setSelectedRouterId: vi.fn(),
      setCurrentScreen: vi.fn(),
      setSelectedDecisionId: vi.fn(),
      openModal: vi.fn(),
      addToast: vi.fn()
    } as unknown as ReturnType<typeof useApp>);

    render(<OperacionesWispScreen />);

    expect(screen.getByText('MikroTik no conectado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar dry-run' })).toBeDisabled();
  });

  it('renders Equipo IA safely while no agent profiles are available', () => {
    mockedUseApp.mockReturnValue({
      agents: [],
      conversations: [],
      updateAgent: vi.fn(),
      setCurrentScreen: vi.fn(),
      setSelectedAgentId: vi.fn(),
      appMode: 'production'
    } as unknown as ReturnType<typeof useApp>);

    render(<EquipoIAScreen />);

    expect(screen.getByText('Perfiles no disponibles')).toBeInTheDocument();
    expect(screen.getAllByText(/PRODUCCIÓN/).length).toBeGreaterThan(0);
  });
});
