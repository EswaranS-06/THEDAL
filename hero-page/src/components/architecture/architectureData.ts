import { Node, Edge } from '@xyflow/react';

export type FlowMode = 'architecture' | 'data' | 'attack';

export interface ArchitectureNodeData extends Record<string, unknown> {
  id: 'bastion' | 'wazuh' | 'windows' | 'web' | 'attack';
  name: string;
  role: string;
  ip: string;
  subnet: string;
  zone: string;
  os: string;
  ports: string[];
  services: string[];
  telemetry: string;
  badge: string;
  badgeColor: string;
  status: 'online' | 'active' | 'alert';
  isActiveTarget?: boolean;
  isSource?: boolean;
  isSiem?: boolean;
}

export type CustomNodeDef = Node<ArchitectureNodeData>;

export const ARCHITECTURE_NODES: CustomNodeDef[] = [
  {
    id: 'bastion',
    type: 'customArchitectureNode',
    position: { x: 340, y: 20 },
    data: {
      id: 'bastion',
      name: 'THEDAL-bastion',
      role: 'Public Gateway & Proxy',
      ip: '10.10.1.10',
      subnet: '10.10.1.0/24',
      zone: 'MANAGEMENT / EDGE TIER',
      os: 'Ubuntu 22.04 LTS',
      ports: ['22', '3128'],
      services: ['Squid Forward Proxy', 'SSH ProxyJump', '$0 NAT Gateway'],
      telemetry: 'auth.log & squid access stream',
      badge: 'Public Edge',
      badgeColor: '#6ED6FF',
      status: 'online',
    },
  },
  {
    id: 'attack',
    type: 'customArchitectureNode',
    position: { x: 40, y: 180 },
    data: {
      id: 'attack',
      name: 'THEDAL-attack',
      role: 'Adversary Simulation',
      ip: '10.10.20.10',
      subnet: '10.10.20.0/24',
      zone: 'ADVERSARY ZONE',
      os: 'Ubuntu 22.04 + Atomic Red Team',
      ports: ['22 (ProxyJump)'],
      services: ['Invoke-AtomicRedTeam', 'Web Exploit Harness', 'Python Automation'],
      telemetry: 'Adversary audit trail logs',
      badge: 'Red Team',
      badgeColor: '#FF5A5F',
      status: 'online',
    },
  },
  {
    id: 'windows',
    type: 'customArchitectureNode',
    position: { x: 340, y: 180 },
    data: {
      id: 'windows',
      name: 'THEDAL-windows',
      role: 'Instrumented Windows Endpoint',
      ip: '10.10.10.20',
      subnet: '10.10.10.0/24',
      zone: 'WORKLOAD TARGET TIER',
      os: 'Windows Server 2022 Datacenter',
      ports: ['5985', '3389', '1514'],
      services: ['Sysmon v15.15', 'PowerShell EID 4104', 'Wazuh Agent 4.7'],
      telemetry: 'socforge-sysmon-*, socforge-powershell-*',
      badge: 'Endpoint Target',
      badgeColor: '#4F8CFF',
      status: 'online',
    },
  },
  {
    id: 'web',
    type: 'customArchitectureNode',
    position: { x: 340, y: 340 },
    data: {
      id: 'web',
      name: 'THEDAL-web',
      role: 'Vulnerable Linux Target',
      ip: '10.10.30.10',
      subnet: '10.10.30.0/24',
      zone: 'WORKLOAD TARGET TIER',
      os: 'Ubuntu 22.04 + Nginx',
      ports: ['8000', '3000', '1514'],
      services: ['DVWA (:8000)', 'Juice Shop (:3000)', 'Linux Kernel auditd'],
      telemetry: 'socforge-nginx-access-*, socforge-auditd-*',
      badge: 'Web Target',
      badgeColor: '#FBBF24',
      status: 'online',
    },
  },
  {
    id: 'wazuh',
    type: 'customArchitectureNode',
    position: { x: 640, y: 220 },
    data: {
      id: 'wazuh',
      name: 'THEDAL-wazuh',
      role: 'SIEM Core & OpenSearch',
      ip: '10.10.10.10',
      subnet: '10.10.10.0/24',
      zone: 'SOC OPERATIONS TIER',
      os: 'Ubuntu 22.04 (SOC Core)',
      ports: ['1514', '1515', '55000', '9200', '443'],
      services: ['Wazuh 4.7 Detection Engine', 'OpenSearch Indexer', 'Filebeat Pipeline'],
      telemetry: 'wazuh-alerts-*, OpenSearch Indices',
      badge: 'SIEM Core',
      badgeColor: '#4ADE80',
      status: 'online',
    },
  },
];

const defaultLabelStyle = {
  fill: '#8E959F',
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 500,
};

const defaultLabelBgStyle = {
  fill: '#090b0e',
  fillOpacity: 0.95,
  stroke: 'rgba(255, 255, 255, 0.08)',
  strokeWidth: 1,
};

const labelBgPadding: [number, number] = [6, 3];
const labelBgBorderRadius = 4;

export function getEdgesForMode(mode: FlowMode, _selectedNodeId?: string): Edge[] {
  if (mode === 'architecture') {
    return [
      {
        id: 'e-bastion-attack',
        source: 'bastion',
        target: 'attack',
        label: 'ProxyJump (SSH)',
        type: 'smoothstep',
        labelStyle: defaultLabelStyle,
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1.2 },
      },
      {
        id: 'e-bastion-windows',
        source: 'bastion',
        target: 'windows',
        label: 'WinRM / Proxy',
        type: 'smoothstep',
        labelStyle: defaultLabelStyle,
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1.2 },
      },
      {
        id: 'e-bastion-web',
        source: 'bastion',
        target: 'web',
        label: 'Squid Proxy',
        type: 'smoothstep',
        labelStyle: defaultLabelStyle,
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1.2 },
      },
      {
        id: 'e-bastion-wazuh',
        source: 'bastion',
        target: 'wazuh',
        label: 'Tunnel :8443',
        type: 'smoothstep',
        labelStyle: defaultLabelStyle,
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1.2 },
      },
      {
        id: 'e-attack-windows',
        source: 'attack',
        target: 'windows',
        label: 'Atomics Vector',
        type: 'smoothstep',
        labelStyle: { ...defaultLabelStyle, fill: '#FF5A5F' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 90, 95, 0.25)', strokeWidth: 1.2, strokeDasharray: '4 4' },
      },
      {
        id: 'e-attack-web',
        source: 'attack',
        target: 'web',
        label: 'HTTP Exploit',
        type: 'smoothstep',
        labelStyle: { ...defaultLabelStyle, fill: '#FF5A5F' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 90, 95, 0.25)', strokeWidth: 1.2, strokeDasharray: '4 4' },
      },
      {
        id: 'e-windows-wazuh',
        source: 'windows',
        target: 'wazuh',
        label: 'Agent :1514',
        type: 'smoothstep',
        labelStyle: { ...defaultLabelStyle, fill: '#4F8CFF' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(79, 140, 255, 0.25)', strokeWidth: 1.2 },
      },
      {
        id: 'e-web-wazuh',
        source: 'web',
        target: 'wazuh',
        label: 'Agent :1514',
        type: 'smoothstep',
        labelStyle: { ...defaultLabelStyle, fill: '#4F8CFF' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(79, 140, 255, 0.25)', strokeWidth: 1.2 },
      },
    ];
  }

  if (mode === 'data') {
    return [
      {
        id: 'e-windows-wazuh',
        source: 'windows',
        target: 'wazuh',
        label: 'Sysmon v15 + EID 4104 Stream',
        type: 'smoothstep',
        animated: true,
        labelStyle: { ...defaultLabelStyle, fill: '#4F8CFF' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: '#4F8CFF', strokeWidth: 2 },
      },
      {
        id: 'e-web-wazuh',
        source: 'web',
        target: 'wazuh',
        label: 'Nginx Access + auditd Stream',
        type: 'smoothstep',
        animated: true,
        labelStyle: { ...defaultLabelStyle, fill: '#4ADE80' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: '#4ADE80', strokeWidth: 2 },
      },
      {
        id: 'e-bastion-wazuh',
        source: 'bastion',
        target: 'wazuh',
        label: 'auth.log & Proxy Ingest',
        type: 'smoothstep',
        animated: true,
        labelStyle: { ...defaultLabelStyle, fill: '#6ED6FF' },
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: '#6ED6FF', strokeWidth: 1.5 },
      },
      {
        id: 'e-attack-wazuh',
        source: 'attack',
        target: 'wazuh',
        label: 'Adversary Execution Logs',
        type: 'smoothstep',
        animated: false,
        labelStyle: defaultLabelStyle,
        labelBgStyle: defaultLabelBgStyle,
        labelBgPadding,
        labelBgBorderRadius,
        style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
      },
    ];
  }

  // Attack Flow Mode
  return [
    {
      id: 'e-bastion-attack',
      source: 'bastion',
      target: 'attack',
      label: '1. Dispatch via ProxyJump',
      type: 'smoothstep',
      animated: true,
      labelStyle: { ...defaultLabelStyle, fill: '#6ED6FF' },
      labelBgStyle: defaultLabelBgStyle,
      labelBgPadding,
      labelBgBorderRadius,
      style: { stroke: '#6ED6FF', strokeWidth: 1.8 },
    },
    {
      id: 'e-attack-windows',
      source: 'attack',
      target: 'windows',
      label: '2. Execute ScriptBlock / Mimikatz',
      type: 'smoothstep',
      animated: true,
      labelStyle: { ...defaultLabelStyle, fill: '#FF5A5F' },
      labelBgStyle: defaultLabelBgStyle,
      labelBgPadding,
      labelBgBorderRadius,
      style: { stroke: '#FF5A5F', strokeWidth: 2.2 },
    },
    {
      id: 'e-attack-web',
      source: 'attack',
      target: 'web',
      label: '2b. Execute Web SQLi',
      type: 'smoothstep',
      animated: true,
      labelStyle: { ...defaultLabelStyle, fill: '#FF5A5F' },
      labelBgStyle: defaultLabelBgStyle,
      labelBgPadding,
      labelBgBorderRadius,
      style: { stroke: '#FF5A5F', strokeWidth: 2.2 },
    },
    {
      id: 'e-windows-wazuh',
      source: 'windows',
      target: 'wazuh',
      label: '3. Sysmon Event EID 4104 Stream',
      type: 'smoothstep',
      animated: true,
      labelStyle: { ...defaultLabelStyle, fill: '#4ADE80' },
      labelBgStyle: defaultLabelBgStyle,
      labelBgPadding,
      labelBgBorderRadius,
      style: { stroke: '#4ADE80', strokeWidth: 2 },
    },
    {
      id: 'e-web-wazuh',
      source: 'web',
      target: 'wazuh',
      label: '3b. Nginx HTTP 200 Stream',
      type: 'smoothstep',
      animated: true,
      labelStyle: { ...defaultLabelStyle, fill: '#4ADE80' },
      labelBgStyle: defaultLabelBgStyle,
      labelBgPadding,
      labelBgBorderRadius,
      style: { stroke: '#4ADE80', strokeWidth: 2 },
    },
  ];
}
