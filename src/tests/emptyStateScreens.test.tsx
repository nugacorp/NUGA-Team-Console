import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipoIAScreen } from '../components/screens/EquipoIAScreen';
import { OperacionesWispScreen } from '../components/screens/OperacionesWispScreen';
import { NugaCoreScreen } from '../components/screens/NugaCoreScreen';
import { TareasScreen } from '../components/screens/TareasScreen';
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

  it('does not render fabricated NugaCore metrics when the real endpoint is unavailable', async () => {
    mockedUseApp.mockReturnValue({
      appMode: 'production',
      providers: {
        nugaCore: {
          getArchitectureOverview: vi.fn().mockResolvedValue({
            status: 'unavailable',
            error: 'NugaCore no está conectado.',
            isDemo: false
          })
        }
      },
      serverStatus: { integrations: { nugacore: false } }
    } as unknown as ReturnType<typeof useApp>);

    render(<NugaCoreScreen />);

    expect(await screen.findByText('NugaCore no conectado')).toBeInTheDocument();
    expect(screen.queryByText('142/142')).not.toBeInTheDocument();
    expect(screen.queryByText('92.4%')).not.toBeInTheDocument();
    expect(screen.queryByText('Simulación Sandbox')).not.toBeInTheDocument();
  });

  it('moves the viewport to the real Hermes detail when a task card is selected', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView
    });
    const setSelectedTaskId = vi.fn();
    const task = {
      id: 'nuga-team-lab:task-real',
      code: 'HMS-T_REAL',
      title: 'Tarea real de Hermes',
      description: 'Objetivo leído del tablero Hermes.',
      projectId: 'nuga-team-lab',
      assignedAgent: 'director',
      priority: 'alta',
      status: 'backlog',
      progressPercent: 0,
      estimatedHours: 0,
      loggedHours: 0,
      requiresHumanApproval: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      deadline: '',
      hermesBoard: 'nuga-team-lab',
      dataSource: 'hermes'
    };
    mockedUseApp.mockReturnValue({
      tasks: [task],
      updateTask: vi.fn(),
      addTaskComment: vi.fn(),
      selectedTaskId: task.id,
      setSelectedTaskId,
      projects: [],
      agents: [],
      appMode: 'production',
      openModal: vi.fn(),
      loadTaskDetail: vi.fn().mockResolvedValue(undefined),
      taskDetailLoading: false,
      taskDetailError: undefined
    } as unknown as ReturnType<typeof useApp>);

    render(<TareasScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir detalle real de Tarea real de Hermes' }));

    expect(setSelectedTaskId).toHaveBeenCalledWith(task.id);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(screen.getByText('Objetivo leído del tablero Hermes.')).toBeInTheDocument();
  });
});
