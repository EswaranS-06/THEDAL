export type AttackScenarioId = 'powershell' | 'sqli' | 'task';

export type SimulationPhase =
  | 'idle'
  | 'firing'
  | 'packet_in_transit'
  | 'endpoint_hit'
  | 'siem_ingesting'
  | 'rule_evaluated'
  | 'alert_generated';

export interface AttackScenario {
  id: AttackScenarioId;
  mitreCode: string;
  title: string;
  subtitle: string;
  category: string;
  tactics: string[];
  command: string;
  sourceNode: string;
  targetNode: string;
  targetHost: string;
  targetIp: string;
  index: string;
  logSource: string;
  ruleName: string;
  ruleId: number;
  severity: string;
  severityLevel: number;
  severityColor: 'amber' | 'rose' | 'emerald';
  eventData: {
    event_id: string | number;
    channel?: string;
    parent_process?: string;
    scriptblock?: string;
    image?: string;
    command_line?: string;
    uri?: string;
    src_ip?: string;
    detection_rule: string;
    severity: string;
    mitre_tactic: string;
    wazuh_agent_id: string;
  };
  metrics: {
    baseEps: number;
    peakEps: number;
    detectionLatencyMs: number;
    confidence: number;
  };
}

export interface NetworkNodeDef {
  id: string;
  name: string;
  ip: string;
  role: 'attacker' | 'bastion' | 'web' | 'windows' | 'linux' | 'siem' | 'opensearch' | 'analyst';
  position: [number, number, number];
  accentColor: string;
  glowColor: string;
  tier: 'external' | 'perimeter' | 'internal' | 'security';
  description: string;
}

export interface NetworkEdgeDef {
  id: string;
  source: string;
  target: string;
  type: 'attack' | 'telemetry' | 'index' | 'analyst';
  color: string;
  dashed?: boolean;
}

export interface SimulationState {
  scenarioId: AttackScenarioId;
  phase: SimulationPhase;
  progress: number; // 0 to 100%
  activePacket: {
    from: string;
    to: string;
    progress: number;
  } | null;
  eventsPerSec: number;
  historyEps: number[];
  triggeredAt: number | null;
  completedAt: number | null;
}
