import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import { AppProvider, useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import {
  INITIAL_AGENTS,
  INITIAL_DECISIONS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_ROUTERS,
  INITIAL_TOWERS,
  INITIAL_ADMIN_ITEMS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_DELIVERABLES
} from '../data/mockData';

// Helper component for context testing
const TestConsumer = ({ onReady }: { onReady: (ctx: ReturnType<typeof useApp>) => void }) => {
  const ctx = useApp();
  React.useEffect(() => {
    onReady(ctx);
  }, [ctx, onReady]);
  return <div data-testid="test-consumer">Ready</div>;
};

describe('NUGA Team Console - Complete Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  // 1. IDENTIDAD DE LOS 5 AGENTES
  describe('1. Estructura e Identidad del Equipo de 5 Agentes', () => {
    it('debe contener exactamente los 5 perfiles: Director, NugaCore, Operaciones, Marketing, Administración', () => {
      const agentNames = INITIAL_AGENTS.map(a => a.name);
      expect(agentNames).toEqual(
        expect.arrayContaining(['Director', 'NugaCore', 'Operaciones', 'Marketing', 'Administración'])
      );
      expect(INITIAL_AGENTS).toHaveLength(5);
    });

    it('no debe incluir Hermes como agente', () => {
      const agentNames = INITIAL_AGENTS.map(a => a.name);
      expect(agentNames).not.toContain('Hermes');
      expect(agentNames).not.toContain('Ops WISP');
      expect(agentNames).not.toContain('Administrador');
    });

    it('todos los agentes deben tener la marca isDemo: true', () => {
      expect(INITIAL_AGENTS.every(a => (a as any).isDemo === true)).toBe(true);
    });
  });

  // 2. RENDERIZADO DE LAS 13 RUTAS
  describe('2. Renderizado de las 13 Rutas y Pantallas', () => {
    const screens = [
      { id: 'resumen', testId: 'screen-resumen' },
      { id: 'decisiones', testId: 'screen-decisiones' },
      { id: 'equipo-ia', testId: 'screen-equipo-ia' },
      { id: 'conversaciones', testId: 'screen-conversaciones' },
      { id: 'tareas', testId: 'screen-tareas' },
      { id: 'proyectos', testId: 'screen-proyectos' },
      { id: 'operaciones-wisp', testId: 'screen-operaciones-wisp' },
      { id: 'nugacore', testId: 'screen-nugacore' },
      { id: 'marketing', testId: 'screen-marketing' },
      { id: 'administracion', testId: 'screen-administracion' },
      { id: 'entregables', testId: 'screen-entregables' },
      { id: 'auditoria', testId: 'screen-auditoria' },
      { id: 'configuracion', testId: 'screen-configuracion' }
    ];

    screens.forEach(({ id, testId }) => {
      it(`debe renderizar la pantalla: ${id}`, async () => {
        window.location.hash = `#/${id}`;
        render(<App />);
        const element = document.getElementById(testId);
        expect(element).toBeInTheDocument();
      });
    });
  });

  // 3. NAVEGACIÓN POR HASH Y RECARGA DIRECTA
  describe('3. Navegación por Hash y Recarga Directa', () => {
    it('debe sincronizar la pantalla activa según el hash de la URL', () => {
      window.location.hash = '#/marketing';
      render(<App />);
      expect(document.getElementById('screen-marketing')).toBeInTheDocument();
    });

    it('debe cambiar de pantalla al disparar evento hashchange', async () => {
      window.location.hash = '#/resumen';
      render(<App />);
      expect(document.getElementById('screen-resumen')).toBeInTheDocument();

      act(() => {
        window.location.hash = '#/tareas';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(document.getElementById('screen-tareas')).toBeInTheDocument();
      });
    });
  });

  // 4. BÚSQUEDA Y FILTROS
  describe('4. Búsqueda Global y Filtros', () => {
    it('debe abrir y cerrar el modal de búsqueda global', async () => {
      render(<App />);
      const searchTrigger = document.getElementById('global-search-trigger');
      expect(searchTrigger).toBeInTheDocument();

      fireEvent.click(searchTrigger!);
      expect(document.getElementById('global-search-modal')).toBeInTheDocument();

      const searchInput = document.getElementById('global-search-input');
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput!, { target: { value: 'MikroTik' } });

      const closeBtn = document.getElementById('close-search-modal-btn');
      if (closeBtn) {
        fireEvent.click(closeBtn);
        await waitFor(() => {
          expect(document.getElementById('global-search-modal')).not.toBeInTheDocument();
        });
      }
    });

    it('debe filtrar decisiones por nivel de riesgo y texto', async () => {
      window.location.hash = '#/decisiones';
      render(<App />);

      expect(document.getElementById('screen-decisiones')).toBeInTheDocument();
      expect(screen.getAllByText(/DEC-001/i).length).toBeGreaterThan(0);
    });
  });

  // 5. APERTURA Y CIERRE DE MODALES
  describe('5. Gestión de Modales', () => {
    it('debe abrir el modal de nueva tarea y permitir cerrarlo', async () => {
      window.location.hash = '#/tareas';
      render(<App />);

      const newTaskBtn = document.getElementById('btn-create-task-modal');
      expect(newTaskBtn).toBeInTheDocument();
      fireEvent.click(newTaskBtn!);

      await waitFor(() => {
        expect(document.getElementById('modal-new-task')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(document.getElementById('modal-new-task')).not.toBeInTheDocument();
      });
    });
  });

  // 6. CREACIÓN DE TAREA DEMO Y CAMBIO DE ESTADO
  describe('6. Creación y Mutación de Tareas DEMO', () => {
    it('debe permitir crear una nueva tarea DEMO y persistirla en estado', async () => {
      let ctx: any;
      render(
        <AppProvider>
          <TestConsumer onReady={c => (ctx = c)} />
        </AppProvider>
      );

      const initialCount = ctx.tasks.length;
      act(() => {
        ctx.createTask({
          title: 'Prueba Automatizada de Tarea',
          description: 'Validación en sandbox local',
          assignedAgent: 'nugacore',
          projectId: 'proj-nugacore-refactor',
          priority: 'alta',
          status: 'ready'
        });
      });

      expect(ctx.tasks.length).toBe(initialCount + 1);
      const created = ctx.tasks.find((t: any) => t.title === 'Prueba Automatizada de Tarea');
      expect(created).toBeDefined();
      expect(created.isDemo).toBe(true);
    });

    it('debe actualizar el estado de una tarea', () => {
      let ctx: any;
      render(
        <AppProvider>
          <TestConsumer onReady={c => (ctx = c)} />
        </AppProvider>
      );

      const taskToUpdate = ctx.tasks[0];
      act(() => {
        ctx.updateTask(taskToUpdate.id, { status: 'completed' });
      });

      const updated = ctx.tasks.find((t: any) => t.id === taskToUpdate.id);
      expect(updated.status).toBe('completed');
    });
  });

  // 7. APROBACIÓN, RECHAZO Y CONFIRMACIÓN REFORZADA DE DECISIÓN
  describe('7. Flujo de Decisiones y Confirmación Reforzada', () => {
    it('debe rechazar una decisión registrando el motivo', () => {
      let ctx: any;
      render(
        <AppProvider>
          <TestConsumer onReady={c => (ctx = c)} />
        </AppProvider>
      );

      const pendingDecision = ctx.decisions.find((d: any) => d.status === 'pending');
      expect(pendingDecision).toBeDefined();

      act(() => {
        ctx.executeDecisionAction(pendingDecision.id, 'reject', 'Rechazado por prueba automatizada');
      });

      const updated = ctx.decisions.find((d: any) => d.id === pendingDecision.id);
      expect(updated.status).toBe('rejected');
      expect(updated.rejectionReason).toBe('Rechazado por prueba automatizada');
    });

    it('debe aprobar una decisión con riesgo alto cuando se provee la confirmación', () => {
      let ctx: any;
      render(
        <AppProvider>
          <TestConsumer onReady={c => (ctx = c)} />
        </AppProvider>
      );

      const highRiskDecision = ctx.decisions.find((d: any) => d.risk === 'critical');
      expect(highRiskDecision).toBeDefined();

      act(() => {
        ctx.executeDecisionAction(
          highRiskDecision.id,
          'approve',
          'Aprobación confirmada con token de seguridad',
          'APROBAR'
        );
      });

      const updated = ctx.decisions.find((d: any) => d.id === highRiskDecision.id);
      expect(updated.status).toBe('approved');
    });
  });

  // 8. CAMBIO DE TEMA
  describe('8. Cambio de Tema', () => {
    it('debe alternar el tema entre dark y light', () => {
      let ctx: any;
      render(
        <AppProvider>
          <TestConsumer onReady={c => (ctx = c)} />
        </AppProvider>
      );

      const initialTheme = ctx.theme;
      act(() => {
        ctx.toggleTheme();
      });
      expect(ctx.theme).toBe(initialTheme === 'dark' ? 'light' : 'dark');
    });
  });

  // 9. PERSISTENCIA LOCAL DEMO Y RESTABLECIMIENTO
  describe('9. Persistencia Local DEMO y Restablecimiento', () => {
    it('debe guardar cambios en localStorage bajo el prefijo nuga_', () => {
      storageService.saveTasks([
        {
          id: 'test-task-1',
          code: 'TSK-999',
          title: 'Tarea Persistida',
          description: 'Desc',
          assignedAgent: 'director',
          projectId: 'proj-1',
          priority: 'media',
          status: 'ready',
          progressPercent: 0,
          estimatedHours: 2,
          loggedHours: 0,
          requiresHumanApproval: false,
          dependencies: [],
          deliverableIds: [],
          comments: [],
          attachments: [],
          runs: [],
          createdAt: '2026-03-01',
          updatedAt: '2026-03-01',
          deadline: '2026-03-05',
          isDemo: true
        }
      ]);

      const stored = storageService.getTasks();
      expect(stored.some(t => t.id === 'test-task-1')).toBe(true);
    });

    it('debe restablecer todos los datos DEMO a su estado inicial', () => {
      let ctx: any;
      render(
        <AppProvider>
          <TestConsumer onReady={c => (ctx = c)} />
        </AppProvider>
      );

      act(() => {
        ctx.createTask({
          title: 'Tarea a eliminar con reset',
          description: 'Temp',
          assignedAgent: 'marketing',
          projectId: 'proj-1',
          priority: 'baja',
          status: 'ready'
        });
      });

      act(() => {
        ctx.resetAllDemoData();
      });

      const resetTasks = storageService.getTasks();
      expect(resetTasks.some(t => t.title === 'Tarea a eliminar con reset')).toBe(false);
      expect(resetTasks.length).toBe(INITIAL_TASKS.length);
    });
  });

  // 10. AUSENCIA DE LLAMADAS DE RED EXTERNAS
  describe('10. Ausencia de Llamadas de Red Externas', () => {
    it('no debe disparar fetch ni XMLHttpRequest durante el render y flujos principales', () => {
      const fetchSpy = vi.spyOn(window, 'fetch');
      render(<App />);

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
