import { WispTower, MikroTikRouter, WispLink, WispIncident } from '../types';

const RAW_TOWERS: WispTower[] = [
  {
    id: 'tower-centro',
    name: 'Torre Centro (Nodo Principal)',
    location: 'Cerro Mirador, Cota 850m',
    status: 'online',
    independentUplink: true,
    uplinkProvider: 'Carrier Metro Fibra 1Gbps',
    routerIdentity: 'EDGE-DEMO-01 / TORRE-CENTRO-01',
    switchModel: 'MikroTik CRS326-24G-2S+RM',
    sectorsCount: 4,
    connectedClients: 112,
    avgSignalDbm: -58,
    avgLatencyMs: 4.2,
    currentTrafficMbps: 420,
    maxCapacityMbps: 1000,
    alerts: [],
    coordinates: { x: 380, y: 180 }
  },
  {
    id: 'tower-norte',
    name: 'Torre Norte (Zona Residencial)',
    location: 'Colina Alta, Cota 720m',
    status: 'warning',
    independentUplink: false,
    uplinkProvider: 'Enlace RF 5GHz desde Torre Centro',
    routerIdentity: 'TORRE-NORTE-DEMO',
    switchModel: 'MikroTik NetPower 16P',
    sectorsCount: 3,
    connectedClients: 84,
    avgSignalDbm: -64,
    avgLatencyMs: 14.8,
    currentTrafficMbps: 185,
    maxCapacityMbps: 300,
    alerts: ['Jitter elevado (22ms) en sector 2', 'Piso de ruido alto en canal 5500 MHz'],
    coordinates: { x: 220, y: 80 }
  },
  {
    id: 'tower-sur',
    name: 'Torre Sur (Zona Comercial & PYME)',
    location: 'Parque Industrial Sur',
    status: 'online',
    independentUplink: true,
    uplinkProvider: 'Fibra Regional Respaldo 200Mbps',
    routerIdentity: 'TORRE-SUR-DEMO',
    switchModel: 'MikroTik CSS326-24G-2S+RM',
    sectorsCount: 3,
    connectedClients: 56,
    avgSignalDbm: -55,
    avgLatencyMs: 6.1,
    currentTrafficMbps: 130,
    maxCapacityMbps: 500,
    alerts: [],
    coordinates: { x: 260, y: 320 }
  },
  {
    id: 'tower-este',
    name: 'Torre Este (Expansión Suburbana)',
    location: 'Valle Verde, Cota 640m',
    status: 'warning',
    independentUplink: false,
    uplinkProvider: 'Enlace PTP 5GHz desde Torre Norte',
    routerIdentity: 'TORRE-ESTE-01',
    switchModel: 'MikroTik RB260GS',
    sectorsCount: 2,
    connectedClients: 35,
    avgSignalDbm: -68,
    avgLatencyMs: 18.4,
    currentTrafficMbps: 68,
    maxCapacityMbps: 150,
    alerts: ['Reintentos de paquetes en enlace de transporte'],
    coordinates: { x: 540, y: 140 }
  }
];

const RAW_ROUTERS: MikroTikRouter[] = [
  {
    id: 'router-edge-01',
    identity: 'EDGE-DEMO-01',
    model: 'CCR2004-16G-2S+',
    routerOsVersion: 'RouterOS v7.14.3',
    cpuPercent: 24,
    ramUsagePercent: 32,
    freeDiskMb: 1120,
    uptime: '48d 14h 22m',
    towerId: 'tower-centro',
    status: 'warning',
    interfaces: [
      { name: 'ether1-WAN-FIBRA', type: 'ethernet', status: 'up', ipAddress: '198.51.100.2/29', trafficRxMbps: 380, trafficTxMbps: 65 },
      { name: 'sfp-plus1-TRONCAL', type: 'sfp', status: 'up', ipAddress: '192.0.2.1/24', trafficRxMbps: 180, trafficTxMbps: 340 },
      { name: 'wireguard1-ADMIN', type: 'wireguard', status: 'up', ipAddress: '192.0.2.254/24', trafficRxMbps: 4.5, trafficTxMbps: 4.2 },
      { name: 'vlan10-MGMT', type: 'vlan', status: 'up', ipAddress: '192.0.2.10/24', trafficRxMbps: 1.2, trafficTxMbps: 1.1 }
    ],
    routeSummary: { total: 48, bgp: 2, ospf: 14, static: 6, defaultGateway: '198.51.100.1' },
    dhcpLeasesCount: 0, // Enrutador core, sin DHCP de abonados
    dnsServers: ['1.1.1.1', '8.8.8.8'],
    firewallRulesCount: 42,
    wireguardPeersCount: 6,
    queuesSimpleCount: 0,
    servicesRunning: [
      { name: 'api', port: 8728, status: 'disabled' },
      { name: 'api-ssl', port: 8729, status: 'disabled' },
      { name: 'ftp', port: 21, status: 'disabled' },
      { name: 'ssh', port: 2222, status: 'enabled' },
      { name: 'telnet', port: 23, status: 'disabled' },
      { name: 'winbox', port: 8291, status: 'enabled' },
      { name: 'www', port: 80, status: 'disabled' },
      { name: 'www-ssl', port: 443, status: 'enabled' }
    ],
    findings: [
      {
        id: 'f-1',
        title: 'Winbox expuesto a Internet en interfaz WAN ether1',
        severity: 'critical',
        category: 'firewall',
        description: 'El puerto TCP 8291 no cuenta con filtro de origen por address-list y responde a peticiones públicas.',
        impact: 'Riesgo de ataque de fuerza bruta o explotación de vulnerabilidades en el servicio de gestión.',
        recommendation: 'Restringir el acceso a Winbox únicamente a través de la interfaz wireguard1 y la subred de administración.',
        requiredDecisionCode: 'DEC-001',
        commandSnippet: '/ip firewall filter add chain=input in-interface=ether1-WAN-FIBRA dst-port=8291 protocol=tcp action=drop'
      },
      {
        id: 'f-2',
        title: 'Falta de regla FastTrack en tráfico de forwarding estándar',
        severity: 'medium',
        category: 'firewall',
        description: 'El tráfico establecido/relacionado pasa por toda la cadena filter sin aceleración de hardware.',
        impact: 'Uso de CPU 15% superior al óptimo bajo tráfico de 400+ Mbps.',
        recommendation: 'Añadir regla fasttrack-connection con bypass seguro para colas con prioridad.',
        commandSnippet: '/ip firewall filter add chain=forward action=fasttrack-connection connection-state=established,related'
      }
    ],
    auditHistory: [
      { date: '2026-08-28', auditorAgent: 'operaciones', scorePercent: 82, findingsCount: 2 },
      { date: '2026-08-15', auditorAgent: 'operaciones', scorePercent: 78, findingsCount: 4 }
    ]
  },
  {
    id: 'router-torre-norte',
    identity: 'TORRE-NORTE-DEMO',
    model: 'RB5009UG+S+IN',
    routerOsVersion: 'RouterOS v7.14.1',
    cpuPercent: 38,
    ramUsagePercent: 44,
    freeDiskMb: 850,
    uptime: '22d 08h 10m',
    towerId: 'tower-norte',
    status: 'warning',
    interfaces: [
      { name: 'ether1-UPLINK', type: 'ethernet', status: 'up', ipAddress: '192.0.2.18/30', trafficRxMbps: 185, trafficTxMbps: 35 },
      { name: 'ether2-SECTOR-A', type: 'ethernet', status: 'up', ipAddress: '203.0.113.1/26', trafficRxMbps: 65, trafficTxMbps: 12 },
      { name: 'ether3-SECTOR-B', type: 'ethernet', status: 'up', ipAddress: '203.0.113.65/26', trafficRxMbps: 78, trafficTxMbps: 15 },
      { name: 'ether4-SECTOR-C', type: 'ethernet', status: 'up', ipAddress: '203.0.113.129/26', trafficRxMbps: 42, trafficTxMbps: 8 }
    ],
    routeSummary: { total: 18, bgp: 0, ospf: 8, static: 2, defaultGateway: '192.0.2.17' },
    dhcpLeasesCount: 84,
    dnsServers: ['192.0.2.1', '1.1.1.1'],
    firewallRulesCount: 28,
    wireguardPeersCount: 2,
    queuesSimpleCount: 84,
    servicesRunning: [
      { name: 'ssh', port: 2222, status: 'enabled' },
      { name: 'winbox', port: 8291, status: 'enabled' }
    ],
    findings: [
      {
        id: 'f-3',
        title: 'Colas simples sin configuración de Burst para planes de 30M',
        severity: 'high',
        category: 'queues',
        description: 'La limitación estricta genera lentitud percibida en apertura de streams y navegación.',
        impact: 'Quejas reiteradas de usuarios residenciales en horas pico.',
        recommendation: 'Ajustar burst-limit a 50M por 8 segundos con threshold de 25M.',
        requiredDecisionCode: 'DEC-003',
        commandSnippet: '/queue simple set [find name="PLAN-30M"] burst-limit=50M/50M burst-threshold=25M/25M burst-time=8s/8s'
      }
    ],
    auditHistory: [
      { date: '2026-08-28', auditorAgent: 'operaciones', scorePercent: 88, findingsCount: 1 }
    ]
  },
  {
    id: 'router-torre-sur',
    identity: 'TORRE-SUR-DEMO',
    model: 'RB4011iGS+RM',
    routerOsVersion: 'RouterOS v7.14.3',
    cpuPercent: 18,
    ramUsagePercent: 28,
    freeDiskMb: 420,
    uptime: '65d 02h 45m',
    towerId: 'tower-sur',
    status: 'optimal',
    interfaces: [
      { name: 'ether1-WAN-RESPALDO', type: 'ethernet', status: 'up', ipAddress: '198.51.100.34/29', trafficRxMbps: 20, trafficTxMbps: 5 },
      { name: 'sfp-plus1-TRONCAL', type: 'sfp', status: 'up', ipAddress: '192.0.2.22/30', trafficRxMbps: 110, trafficTxMbps: 22 },
      { name: 'bridge-CLIENTES', type: 'bridge', status: 'up', ipAddress: '203.0.113.193/26', trafficRxMbps: 95, trafficTxMbps: 18 }
    ],
    routeSummary: { total: 16, bgp: 0, ospf: 6, static: 3, defaultGateway: '192.0.2.21' },
    dhcpLeasesCount: 56,
    dnsServers: ['1.1.1.1'],
    firewallRulesCount: 32,
    wireguardPeersCount: 2,
    queuesSimpleCount: 56,
    servicesRunning: [
      { name: 'ssh', port: 2222, status: 'enabled' },
      { name: 'winbox', port: 8291, status: 'enabled' }
    ],
    findings: [],
    auditHistory: [
      { date: '2026-08-27', auditorAgent: 'operaciones', scorePercent: 96, findingsCount: 0 }
    ]
  },
  {
    id: 'router-torre-centro',
    identity: 'TORRE-CENTRO-01',
    model: 'CCR1009-7G-1C-1S+',
    routerOsVersion: 'RouterOS v7.13.5',
    cpuPercent: 22,
    ramUsagePercent: 35,
    freeDiskMb: 980,
    uptime: '110d 05h 12m',
    towerId: 'tower-centro',
    status: 'optimal',
    interfaces: [
      { name: 'ether1-LOCAL-LAN', type: 'ethernet', status: 'up', ipAddress: '192.0.2.1/24', trafficRxMbps: 310, trafficTxMbps: 45 },
      { name: 'ether2-SECTOR-CENTRO', type: 'ethernet', status: 'up', ipAddress: '203.0.113.1/25', trafficRxMbps: 140, trafficTxMbps: 25 }
    ],
    routeSummary: { total: 24, bgp: 1, ospf: 12, static: 4, defaultGateway: '192.0.2.254' },
    dhcpLeasesCount: 112,
    dnsServers: ['1.1.1.1', '8.8.4.4'],
    firewallRulesCount: 38,
    wireguardPeersCount: 4,
    queuesSimpleCount: 112,
    servicesRunning: [
      { name: 'ssh', port: 2222, status: 'enabled' }
    ],
    findings: [],
    auditHistory: [
      { date: '2026-08-25', auditorAgent: 'operaciones', scorePercent: 95, findingsCount: 0 }
    ]
  },
  {
    id: 'router-torre-este',
    identity: 'TORRE-ESTE-01',
    model: 'RB750Gr3 (hEX)',
    routerOsVersion: 'RouterOS v7.14.0',
    cpuPercent: 42,
    ramUsagePercent: 68,
    freeDiskMb: 8,
    uptime: '14d 19h 30m',
    towerId: 'tower-este',
    status: 'warning',
    interfaces: [
      { name: 'ether1-GATEWAY', type: 'ethernet', status: 'up', ipAddress: '192.0.2.34/30', trafficRxMbps: 68, trafficTxMbps: 12 },
      { name: 'ether2-SECTOR-ESTE', type: 'ethernet', status: 'up', ipAddress: '203.0.113.129/27', trafficRxMbps: 55, trafficTxMbps: 9 }
    ],
    routeSummary: { total: 10, bgp: 0, ospf: 4, static: 1, defaultGateway: '192.0.2.33' },
    dhcpLeasesCount: 35,
    dnsServers: ['1.1.1.1'],
    firewallRulesCount: 18,
    wireguardPeersCount: 1,
    queuesSimpleCount: 35,
    servicesRunning: [
      { name: 'ssh', port: 2222, status: 'enabled' }
    ],
    findings: [
      {
        id: 'f-4',
        title: 'Espacio libre en disco flash inferior a 10MB',
        severity: 'high',
        category: 'security',
        description: 'La memoria flash NOR de 16MB está al 92% de capacidad debido a logs antiguos.',
        impact: 'Imposibilidad de aplicar actualizaciones de firmware y riesgo de corrupción en reinicio forzado.',
        recommendation: 'Limpiar logs de sistema y redirigir log de firewall a servidor syslog remoto.',
        commandSnippet: '/system logging action set memory memory-lines=100'
      }
    ],
    auditHistory: [
      { date: '2026-08-28', auditorAgent: 'operaciones', scorePercent: 74, findingsCount: 1 }
    ]
  },
  {
    id: 'router-chr-lab',
    identity: 'CHR-LAB-01',
    model: 'Cloud Hosted Router (x86_64)',
    routerOsVersion: 'RouterOS v7.15beta8',
    cpuPercent: 4,
    ramUsagePercent: 12,
    freeDiskMb: 4800,
    uptime: '3d 11h 05m',
    towerId: 'tower-centro',
    status: 'optimal',
    interfaces: [
      { name: 'ether1-MGMT-ISOLATED', type: 'ethernet', status: 'up', ipAddress: '192.0.2.100/24', trafficRxMbps: 2.1, trafficTxMbps: 1.8 },
      { name: 'wireguard-TEST', type: 'wireguard', status: 'up', ipAddress: '192.0.2.200/24', trafficRxMbps: 0.8, trafficTxMbps: 0.6 }
    ],
    routeSummary: { total: 6, bgp: 0, ospf: 0, static: 2, defaultGateway: '192.0.2.1' },
    dhcpLeasesCount: 0,
    dnsServers: ['1.1.1.1'],
    firewallRulesCount: 15,
    wireguardPeersCount: 2,
    queuesSimpleCount: 0,
    servicesRunning: [
      { name: 'ssh', port: 2222, status: 'enabled' },
      { name: 'winbox', port: 8291, status: 'enabled' }
    ],
    findings: [],
    auditHistory: [
      { date: '2026-08-28', auditorAgent: 'operaciones', scorePercent: 100, findingsCount: 0 }
    ]
  }
];

const RAW_LINKS: WispLink[] = [
  { id: 'link-1', name: 'Centro -> WAN Fibra Principal', fromNodeId: 'tower-centro', toNodeId: 'wan-isp-1', frequency: 'Fibra Óptica GPON/SFP+', status: 'optimal', bandwidthMbps: 420, capacityMbps: 1000, snrDb: 45, distanceKm: 0.1 },
  { id: 'link-2', name: 'Centro -> Torre Norte (PTP)', fromNodeId: 'tower-centro', toNodeId: 'tower-norte', frequency: '5.8 GHz (Canal 5745 MHz)', status: 'optimal', bandwidthMbps: 185, capacityMbps: 350, snrDb: 34, distanceKm: 5.4 },
  { id: 'link-3', name: 'Centro -> Torre Sur (Troncal)', fromNodeId: 'tower-centro', toNodeId: 'tower-sur', frequency: 'Fibra Dedicada Aérea', status: 'optimal', bandwidthMbps: 130, capacityMbps: 1000, snrDb: 42, distanceKm: 3.8 },
  { id: 'link-4', name: 'Torre Norte -> Torre Este (PTP)', fromNodeId: 'tower-norte', toNodeId: 'tower-este', frequency: '5.5 GHz (Canal 5500 MHz)', status: 'degraded', bandwidthMbps: 68, capacityMbps: 150, snrDb: 22, distanceKm: 4.2 },
  { id: 'link-5', name: 'Torre Sur -> Respaldo Fibra', fromNodeId: 'tower-sur', toNodeId: 'wan-isp-2', frequency: 'Fibra Regional SFP', status: 'optimal', bandwidthMbps: 20, capacityMbps: 200, snrDb: 40, distanceKm: 0.5 },
  { id: 'link-6', name: 'Torre Este -> Repetidor Rural', fromNodeId: 'tower-este', toNodeId: 'nodo-rural-1', frequency: '5.2 GHz (Canal 5200 MHz)', status: 'optimal', bandwidthMbps: 25, capacityMbps: 80, snrDb: 28, distanceKm: 2.1 },
  { id: 'link-7', name: 'Sector Norte 1 -> Abonados', fromNodeId: 'tower-norte', toNodeId: 'cl-norte-1', frequency: '5.7 GHz AC', status: 'optimal', bandwidthMbps: 65, capacityMbps: 120, snrDb: 31, distanceKm: 1.8 },
  { id: 'link-8', name: 'Sector Norte 2 -> Abonados (Ruido)', fromNodeId: 'tower-norte', toNodeId: 'cl-norte-2', frequency: '5.5 GHz AC', status: 'degraded', bandwidthMbps: 78, capacityMbps: 100, snrDb: 21, distanceKm: 2.3 },
  { id: 'link-9', name: 'Sector Centro 1 -> Clientes Core', fromNodeId: 'tower-centro', toNodeId: 'cl-centro-1', frequency: '5.8 GHz AX', status: 'optimal', bandwidthMbps: 140, capacityMbps: 250, snrDb: 36, distanceKm: 1.2 },
  { id: 'link-10', name: 'Sector Sur 1 -> Parque Industrial', fromNodeId: 'tower-sur', toNodeId: 'cl-sur-1', frequency: '5.8 GHz AC', status: 'optimal', bandwidthMbps: 95, capacityMbps: 200, snrDb: 35, distanceKm: 2.0 },
  { id: 'link-11', name: 'Gestión WireGuard -> CHR Lab', fromNodeId: 'tower-centro', toNodeId: 'router-chr-lab', frequency: 'Túnel Lógico Cifrado', status: 'optimal', bandwidthMbps: 4, capacityMbps: 100, snrDb: 50, distanceKm: 0 },
  { id: 'link-12', name: 'Enlace de Respaldo Centro -> Este', fromNodeId: 'tower-centro', toNodeId: 'tower-este', frequency: '60 GHz PtP (Inactivo Standby)', status: 'optimal', bandwidthMbps: 0, capacityMbps: 1000, snrDb: 38, distanceKm: 6.8 }
];

const RAW_INCIDENTS: WispIncident[] = [
  {
    id: 'inc-001',
    code: 'INC-2026-081',
    title: 'Interferencia y degradación de throughput en enlace Torre Norte - Torre Este',
    priority: 'alta',
    severity: 'medium',
    status: 'mitigating',
    assignedSpecialist: 'operaciones',
    relatedTowerId: 'tower-norte',
    relatedRouterId: 'router-torre-norte',
    affectedClients: 35,
    detectedAt: '2026-08-28 11:20:00',
    timeline: [
      { time: '11:20', event: 'Alerta automática: Latencia > 25ms y reintentos > 18% detectados por SNMP', author: 'Hermes Monitor' },
      { time: '11:35', event: 'Especialista Operaciones inicia escaneo espectral no intrusivo', author: 'operaciones' },
      { time: '12:00', event: 'Formulada propuesta de migración de frecuencia DEC-004', author: 'operaciones' }
    ],
    diagnosis: 'Presencia de fuente transmisora no coordinada en canal 5500 MHz afectando el radio receptor de Torre Este.',
    proposedActions: [
      'Cambiar canal a 5680 MHz DFS con ancho de 40 MHz',
      'Ajustar potencia de transmisión a 18 dBm para optimizar modulación 256-QAM'
    ],
    customerCommunicationPlan: 'Mensaje preventivo a través de portal de soporte informando ventana de ajuste de 2 minutos a las 02:00 AM.',
    resolutionEvidence: 'Pruebas de laboratorio confirman canal 5680 MHz libre de ruido.'
  },
  {
    id: 'inc-002',
    code: 'INC-2026-079',
    title: 'Intento de escaneo de puertos Winbox en IP pública de EDGE-DEMO-01',
    priority: 'urgente',
    severity: 'critical',
    status: 'investigating',
    assignedSpecialist: 'operaciones',
    relatedTowerId: 'tower-centro',
    relatedRouterId: 'router-edge-01',
    affectedClients: 0,
    detectedAt: '2026-08-28 09:15:00',
    timeline: [
      { time: '09:15', event: 'Registro de 42 conexiones TCP al puerto 8291 desde subredes no autorizadas', author: 'Hermes Security' },
      { time: '09:40', event: 'Especialista Operaciones genera reporte y ticket de decisión DEC-001', author: 'operaciones' }
    ],
    diagnosis: 'Servicio Winbox habilitado globalmente en WAN sin restricción de interfaz ni IP origen.',
    proposedActions: [
      'Aplicar drop rule inmediata en ether1-WAN',
      'Migrar gestión exclusivamente a WireGuard'
    ],
    customerCommunicationPlan: 'Incidente interno de seguridad: no requiere comunicación a clientes.'
  },
  {
    id: 'inc-003',
    code: 'INC-2026-078',
    title: 'Microcorte eléctrico en sector sur atendido por banco de baterías',
    priority: 'media',
    severity: 'low',
    status: 'resolved',
    assignedSpecialist: 'operaciones',
    relatedTowerId: 'tower-sur',
    relatedRouterId: 'router-torre-sur',
    affectedClients: 0,
    detectedAt: '2026-08-27 15:30:00',
    resolvedAt: '2026-08-27 16:45:00',
    timeline: [
      { time: '15:30', event: 'Alerta de corte de energía comercial. Entrada de inversor y baterías', author: 'SNMP Power' },
      { time: '16:45', event: 'Restablecimiento de energía de red pública. Baterías al 94%', author: 'SNMP Power' }
    ],
    diagnosis: 'Falla en transformador de la red pública local. El sistema UPS y banco de baterías soportó la carga de 130W sin cortes.',
    proposedActions: ['Revisar ciclo de recarga de baterías'],
    customerCommunicationPlan: 'Sin afectación de servicio.',
    resolutionEvidence: 'Gráfica de voltaje estable a 24.6V durante todo el evento.'
  },
  {
    id: 'inc-004',
    code: 'INC-2026-075',
    title: 'Saturación temporal de Simple Queues en Sector Residencial Norte',
    priority: 'media',
    severity: 'medium',
    status: 'resolved',
    assignedSpecialist: 'operaciones',
    relatedTowerId: 'tower-norte',
    relatedRouterId: 'router-torre-norte',
    affectedClients: 12,
    detectedAt: '2026-08-26 20:10:00',
    resolvedAt: '2026-08-26 22:30:00',
    timeline: [
      { time: '20:10', event: 'Aumento en quejas de streaming con buffering en clientes de 30M', author: 'Soporte' },
      { time: '20:45', event: 'Operaciones evalúa parámetros burst y formula DEC-003', author: 'operaciones' }
    ],
    diagnosis: 'Límites planos sin burst threshold provocaban estrangulamiento de paquetes en streaming 4K.',
    proposedActions: ['Optimizar colas con ráfagas de 8 segundos'],
    customerCommunicationPlan: 'Atención personalizada a los 12 abonados que contactaron a soporte.'
  },
  {
    id: 'inc-005',
    code: 'INC-2026-072',
    title: 'Alineación de antena sectorial 3 descalibrada por ráfagas de viento',
    priority: 'media',
    severity: 'medium',
    status: 'resolved',
    assignedSpecialist: 'operaciones',
    relatedTowerId: 'tower-sur',
    affectedClients: 8,
    detectedAt: '2026-08-24 14:00:00',
    resolvedAt: '2026-08-25 11:00:00',
    timeline: [
      { time: '14:00', event: 'Caída de señal de -58 dBm a -71 dBm en 8 clientes', author: 'Hermes Monitor' },
      { time: '11:00', event: 'Cuadrilla de torre reajusta azimut y aprieta pernos de anclaje', author: 'Cuadrilla Técnica' }
    ],
    diagnosis: 'Desviación de 12 grados en el soporte mecánico de la antena sectorial.',
    proposedActions: ['Re-torqueo con tuercas autoblocantes'],
    customerCommunicationPlan: 'Llamada de confirmación a los 8 clientes afectados verificando señal óptima a -57 dBm.'
  },
  {
    id: 'inc-006',
    code: 'INC-2026-070',
    title: 'Agotamiento de pool DHCP en subred 203.0.113.128/26',
    priority: 'alta',
    severity: 'medium',
    status: 'resolved',
    assignedSpecialist: 'operaciones',
    relatedRouterId: 'router-torre-norte',
    affectedClients: 4,
    detectedAt: '2026-08-22 18:00:00',
    resolvedAt: '2026-08-22 18:45:00',
    timeline: [
      { time: '18:00', event: 'Cliente nuevo no recibe IP de arrendamiento', author: 'Soporte' },
      { time: '18:45', event: 'Reducción de lease-time de 3 días a 12 horas y limpieza de leases obsoletos', author: 'operaciones' }
    ],
    diagnosis: 'Leases dinámicos retenidos por dispositivos desconectados.',
    proposedActions: ['Ampliación de subred a /25'],
    customerCommunicationPlan: 'Resolución directa con técnico en sitio.'
  },
  {
    id: 'inc-007',
    code: 'INC-2026-068',
    title: 'Discrepancia en reporte de consumo de ancho de banda',
    priority: 'baja',
    severity: 'low',
    status: 'resolved',
    assignedSpecialist: 'nugacore',
    affectedClients: 0,
    detectedAt: '2026-08-20 10:00:00',
    resolvedAt: '2026-08-20 12:00:00',
    timeline: [
      { time: '10:00', event: 'Contador de bytes SNMP no redondeaba correctamente unidades GiB en UI', author: 'nugacore' }
    ],
    diagnosis: 'Error de conversión aritmética en módulo de visualización frontend.',
    proposedActions: ['Parche aplicado en adapter de telemetría'],
    customerCommunicationPlan: 'N/A'
  },
  {
    id: 'inc-008',
    code: 'INC-2026-065',
    title: 'Fallo de sincronización DNS secundario en nodo Torre Centro',
    priority: 'media',
    severity: 'low',
    status: 'resolved',
    assignedSpecialist: 'operaciones',
    relatedRouterId: 'router-torre-centro',
    affectedClients: 0,
    detectedAt: '2026-08-18 08:30:00',
    resolvedAt: '2026-08-18 09:15:00',
    timeline: [
      { time: '08:30', event: 'IP 8.8.4.4 no respondía en prueba de resolución local', author: 'Hermes Monitor' },
      { time: '09:15', event: 'Añadido 1.0.0.1 como fallback prioritario', author: 'operaciones' }
    ],
    diagnosis: 'Ruta estática hacia servidor DNS secundario desconfigurada.',
    proposedActions: ['Verificación de redundancia'],
    customerCommunicationPlan: 'Sin impacto en clientes.'
  },
  {
    id: 'inc-009',
    code: 'INC-2026-060',
    title: 'Alerta preventiva: Memoria flash con 92% de ocupación en TORRE-ESTE-01',
    priority: 'alta',
    severity: 'medium',
    status: 'investigating',
    assignedSpecialist: 'operaciones',
    relatedRouterId: 'router-torre-este',
    affectedClients: 0,
    detectedAt: '2026-08-28 07:00:00',
    timeline: [
      { time: '07:00', event: 'Auditoría automática detecta menos de 8MB de disco libre en hEX', author: 'operaciones' }
    ],
    diagnosis: 'Logs de firewall almacenados en memoria persistente sin rotación.',
    proposedActions: ['Reconfigurar logging action a memory con límite de 100 líneas'],
    customerCommunicationPlan: 'N/A'
  },
  {
    id: 'inc-010',
    code: 'INC-2026-055',
    title: 'Atenuación óptica de 3dB en enlace SFP+ Torre Centro',
    priority: 'baja',
    severity: 'low',
    status: 'resolved',
    assignedSpecialist: 'operaciones',
    relatedTowerId: 'tower-centro',
    affectedClients: 0,
    detectedAt: '2026-08-15 16:00:00',
    resolvedAt: '2026-08-16 10:00:00',
    timeline: [
      { time: '16:00', event: 'Lectura DDM reporta -19 dBm en receptor SFP+', author: 'SNMP SFP' },
      { time: '10:00', event: 'Limpieza de conector LC con cinta One-Click cleaner. Potencia restablecida a -14.2 dBm', author: 'Técnico' }
    ],
    diagnosis: 'Polvo acumulado en férula del patchcord de fibra óptica.',
    proposedActions: ['Limpieza óptica periódica'],
    customerCommunicationPlan: 'N/A'
  }
];

export const INITIAL_TOWERS: WispTower[] = RAW_TOWERS.map(tower => ({
  ...tower,
  isDemo: true
}));

export const INITIAL_ROUTERS: MikroTikRouter[] = RAW_ROUTERS.map(router => ({
  ...router,
  isDemo: true
}));

export const INITIAL_LINKS: WispLink[] = RAW_LINKS.map(link => ({
  ...link,
  isDemo: true
}));

export const INITIAL_INCIDENTS: WispIncident[] = RAW_INCIDENTS.map(incident => ({
  ...incident,
  isDemo: true
}));
