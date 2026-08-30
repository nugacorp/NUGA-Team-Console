import { RiskLevel, PriorityLevel } from './types';

export const APP_INFO = {
  name: 'NUGA Team',
  product: 'Team Console',
  version: '1.0.0',
  storage: 'Local',
  engineStatus: 'Hermes · DEMO · No conectado',
  demoNotice: 'Entorno local de demostración. Los datos, agentes, clientes, decisiones y operaciones mostrados son simulados. Ninguna acción modifica sistemas reales.'
};

export const FORMAT_RISK: Record<RiskLevel, string> = {
  critical: 'Riesgo crítico',
  high: 'Riesgo alto',
  medium: 'Riesgo medio',
  low: 'Riesgo bajo'
};

export const FORMAT_PRIORITY: Record<PriorityLevel, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja'
};

export const TEAM_PROFILES_COUNT = 5;
export const TEAM_PROFILES_LABEL = '5 perfiles del equipo';
