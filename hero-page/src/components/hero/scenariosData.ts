export interface AttackScenario {
  id: string;
  mitreCode: string;
  title: string;
  subtitle: string;
  category: string;
  command: string;
  sourceNode: string;
  targetNode: string;
  targetHost: string;
  targetIp: string;
  logSource: string;
  ruleName: string;
  ruleId: number;
  severity: string;
  severityLevel: number;
  rawEvent: {
    channel: string;
    eventId: string | number;
    details: string;
    parentProcess?: string;
    agentId: string;
  };
  metrics: {
    transitLatencyMs: number;
    confidence: number;
    epsRate: number;
  };
}

export interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  tier: 'external' | 'perimeter' | 'internal' | 'siem' | 'analyst';
  role: string;
  os: string;
  x: number; // percentage coordinates 0-100
  y: number;
  specs: string[];
  ports: string[];
  telemetrySource: string;
}

export const SCENARIOS: Record<string, AttackScenario> = {
  powershell: {
    id: 'powershell',
    mitreCode: 'T1059.001',
    title: 'PowerShell Encoded ScriptBlock',
    subtitle: 'Obfuscated In-Memory Credential Dumper Payload',
    category: 'Execution & Evasion',
    command: 'pwsh -EncodedCommand JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAg... -NonInteractive -WindowStyle Hidden',
    sourceNode: 'node-attack',
    targetNode: 'node-windows',
    targetHost: 'THEDAL-windows',
    targetIp: '10.10.10.20',
    logSource: 'Microsoft-Windows-PowerShell/Operational',
    ruleName: 'Wazuh Rule 91802: PowerShell Suspicious Encoded ScriptBlock',
    ruleId: 91802,
    severity: 'CRITICAL (Level 12)',
    severityLevel: 12,
    rawEvent: {
      channel: 'Microsoft-Windows-PowerShell/Operational',
      eventId: 4104,
      details: 'ScriptBlock: Invoke-Mimikatz -DumpCreds (Atomic Red Team Hook)',
      parentProcess: 'explorer.exe (PID: 3412)',
      agentId: '003 (THEDAL-windows)',
    },
    metrics: {
      transitLatencyMs: 240,
      confidence: 99.8,
      epsRate: 184,
    },
  },
  sqli: {
    id: 'sqli',
    mitreCode: 'T1190',
    title: 'DVWA SQL Injection',
    subtitle: 'Web Perimeter Exploit against Unsanitized Query Parameter',
    category: 'Initial Access & Web Exploitation',
    command: "curl -s 'http://10.10.30.10:8000/vulnerabilities/sqli/?id=1%27+OR+%271%27%3D%271&Submit=Submit' -H 'User-Agent: sqlmap/1.7.2'",
    sourceNode: 'node-attack',
    targetNode: 'node-web',
    targetHost: 'THEDAL-web',
    targetIp: '10.10.30.10:8000',
    logSource: '/var/log/nginx/access.log',
    ruleName: 'Wazuh Rule 31101: Web SQL Injection Pattern in URI',
    ruleId: 31101,
    severity: 'CRITICAL (Level 14)',
    severityLevel: 14,
    rawEvent: {
      channel: 'socforge-nginx-access-*',
      eventId: 'HTTP_200_INJECTION',
      details: "URI: /vulnerabilities/sqli/?id=1' OR '1'='1 [Status: 200 OK]",
      agentId: '004 (THEDAL-web)',
    },
    metrics: {
      transitLatencyMs: 180,
      confidence: 99.4,
      epsRate: 212,
    },
  },
  persistence: {
    id: 'persistence',
    mitreCode: 'T1053.005',
    title: 'Scheduled Task Persistence',
    subtitle: 'System Boot Trigger Registration for Backdoor Survivability',
    category: 'Persistence & Privilege Escalation',
    command: 'schtasks /create /tn "SOCSecurityUpdater" /tr "powershell.exe -w hidden -c Get-Telemetry" /sc onlogon /ru SYSTEM',
    sourceNode: 'node-attack',
    targetNode: 'node-windows',
    targetHost: 'THEDAL-windows',
    targetIp: '10.10.10.20',
    logSource: 'Microsoft-Windows-Sysmon/Operational',
    ruleName: 'Wazuh Rule 61603: Scheduled Task Creation for Persistence',
    ruleId: 61603,
    severity: 'HIGH (Level 10)',
    severityLevel: 10,
    rawEvent: {
      channel: 'Microsoft-Windows-Sysmon/Operational',
      eventId: 1,
      details: 'Image: C:\\Windows\\System32\\schtasks.exe | Parent: cmd.exe (PID 1084)',
      parentProcess: 'cmd.exe (PID: 1084)',
      agentId: '003 (THEDAL-windows)',
    },
    metrics: {
      transitLatencyMs: 310,
      confidence: 98.9,
      epsRate: 145,
    },
  },
};

export const TOPOLOGY_NODES: NetworkNode[] = [
  {
    id: 'node-attack',
    name: 'THEDAL-attack',
    ip: '10.10.20.10',
    tier: 'external',
    role: 'Adversary Simulation Launchpad',
    os: 'Ubuntu 22.04 LTS + Atomic Red Team',
    x: 12,
    y: 28,
    specs: ['t3.micro (2 vCPU, 1 GB RAM)', 'Atomic Red Team Engine', 'Automated curl / python harnesses'],
    ports: ['22 (SSH Ingress via Bastion)'],
    telemetrySource: 'Emulation execution audit stream',
  },
  {
    id: 'node-bastion',
    name: 'THEDAL-bastion',
    ip: '10.10.0.10',
    tier: 'perimeter',
    role: 'Egress Gateway & Squid Proxy',
    os: 'Ubuntu 22.04 LTS (Public Edge)',
    x: 36,
    y: 16,
    specs: ['t3.micro (Elastic IP)', 'Squid Forward Proxy (:3128)', '$0 NAT Gateway alternative'],
    ports: ['22 (Public SSH)', '3128 (Squid Proxy)'],
    telemetrySource: 'auth.log & squid access logs',
  },
  {
    id: 'node-windows',
    name: 'THEDAL-windows',
    ip: '10.10.10.20',
    tier: 'internal',
    role: 'Instrumented Windows Endpoint',
    os: 'Windows Server 2022 Datacenter',
    x: 52,
    y: 42,
    specs: ['t3.small (2 vCPU, 2 GB RAM)', 'Sysmon v15.15 with high-fidelity XML', 'ScriptBlock EventID 4104 Logging'],
    ports: ['5985 (WinRM)', '3389 (RDP)', '1514 (Wazuh Outbound)'],
    telemetrySource: 'Sysmon, PowerShell, Security EventLogs',
  },
  {
    id: 'node-web',
    name: 'THEDAL-web',
    ip: '10.10.30.10',
    tier: 'internal',
    role: 'Vulnerable Linux Web App Target',
    os: 'Ubuntu 22.04 + Nginx + DVWA',
    x: 48,
    y: 74,
    specs: ['t3.micro', 'DVWA on port 8000', 'OWASP Juice Shop container on 3000'],
    ports: ['8000 (DVWA HTTP)', '3000 (Juice Shop)', '1514 (Wazuh Outbound)'],
    telemetrySource: 'Nginx access.log, auditd, docker JSON',
  },
  {
    id: 'node-linux',
    name: 'THEDAL-linux',
    ip: '10.10.30.20',
    tier: 'internal',
    role: 'Linux Host with Kernel Auditing',
    os: 'Ubuntu 22.04 LTS + auditd',
    x: 28,
    y: 80,
    specs: ['t3.micro', 'Linux auditd syscall monitoring', 'Wazuh Linux Agent v4.7'],
    ports: ['22 (SSH Ingress)', '1514 (Wazuh Outbound)'],
    telemetrySource: 'auditd execve syscalls, syslog, auth.log',
  },
  {
    id: 'node-siem',
    name: 'WAZUH-SIEM',
    ip: '10.10.0.20',
    tier: 'siem',
    role: 'Wazuh Correlation Manager',
    os: 'Ubuntu 22.04 LTS (SOC Core)',
    x: 80,
    y: 42,
    specs: ['t3.xlarge (4 vCPU, 16 GB RAM)', 'Wazuh 4.7 Detection Engine', 'Central Rule Correlation Engine'],
    ports: ['1514 (Agent Telemetry)', '1515 (Auth)', '55000 (API)', '443 (Dashboard)'],
    telemetrySource: 'wazuh-alerts-* indexed stream',
  },
  {
    id: 'node-opensearch',
    name: 'OpenSearch',
    ip: '10.10.0.20:9200',
    tier: 'siem',
    role: 'Time-Series Telemetry Pipeline',
    os: 'OpenSearch 2.x Cluster',
    x: 88,
    y: 72,
    specs: ['Time-series sharded indexing', 'MITRE ATT&CK Dashboards', 'Pre-configured visualizations'],
    ports: ['9200 (REST Ingest)'],
    telemetrySource: 'socforge-* time-series indices',
  },
];
