// TypeScript types for THEDAL Control Plane API

export interface SystemStatus {
  aws_connected: boolean;
  aws_region: string;
  terraform_status: string;
  ansible_status: string;
  environment_health: "PASS" | "WARNING" | "FAIL" | "UNKNOWN";
  active_operation?: string | null;
}

export interface EC2InstanceInfo {
  name: string;
  instance_id: string;
  instance_type: string;
  state: "running" | "stopped" | "pending" | "stopping" | "terminated" | "unknown";
  private_ip: string;
  public_ip?: string | null;
  role: string;
  availability_zone?: string;
  health: "PASS" | "WARNING" | "FAIL" | "UNKNOWN";
}

export interface NetworkSubnet {
  id: string;
  name: string;
  cidr: string;
  az: string;
  is_public: boolean;
}

export interface NetworkTopology {
  vpc_id: string;
  vpc_cidr: string;
  subnets: NetworkSubnet[];
  nat_gateway_present: boolean;
}

export interface ServiceDetail {
  name: string;
  port: string | number;
  status: string;
  type: string;
}

export interface HostDetailInfo {
  key: string;
  name: string;
  role: string;
  state: string;
  instance_id: string;
  instance_type: string;
  private_ip: string;
  public_ip?: string | null;
  availability_zone?: string;
  health: string;
  os: string;
  purpose: string;
  services: ServiceDetail[];
}

export interface HealthCheckItem {
  component: string;
  status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | "DEGRADED";
  message: string;
  details?: string | null;
}

export interface HealthCheckSummary {
  overall_status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | "DEGRADED";
  timestamp: string;
  checks: HealthCheckItem[];
}

export interface DynamicCommand {
  id?: string;
  category: string;
  title: string;
  target?: string;
  command: string;
  description: string;
  ip?: string;
  target_host?: string;
}

export interface DynamicCommandGroup {
  category: string;
  commands: DynamicCommand[];
}

export interface OperationLogMeta {
  filename: string;
  timestamp: string;
  action: string;
  status: "SUCCESS" | "FAILURE" | "RUNNING" | "UNKNOWN";
  size_bytes: number;
}

export interface OperationDetail {
  filename: string;
  metadata?: OperationLogMeta | null;
  content: string;
}

export interface LabItem {
  id: string;
  title: string;
  level: string;
  level_code: string;
  source: string;
  target_index: string;
  rel_path: string;
  mitre: string;
  status: "Not Started" | "In Progress" | "Completed";
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string;
  attempts?: number;
  bookmarked?: number | boolean;
  difficulty?: string;
  current_step?: number;
  verdict?: string;
}

export interface EvidenceItem {
  id: number;
  lab_id: string;
  source: string;
  event_id?: string;
  timestamp: string;
  finding: string;
  created_at: string;
}

export interface LabQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface LabPhase {
  id: string;
  phase_num: number;
  title: string;
  tag: string;
  objective?: string;
  mission?: string;
  difficulty?: string;
  mitre?: string;
  time?: string;
  source?: string;
  target_index?: string;
  checklist_items?: string[];
  attack_host?: string;
  target_host?: string;
  technique?: string;
  command?: string;
  instructions?: string;
  data_source?: string;
  query?: string;
  query_field?: string;
  hints?: Array<{ title: string; content: string }>;
  cross_query?: string;
  cross_index?: string;
  thinking_title?: string;
  thinking_prompts?: string[];
  questions?: LabQuestion[];
  verdict_options?: Array<{ value: string; label: string }>;
  expected_verdict?: string;
  expected_findings?: string;
  mitre_tactic?: string;
  mitre_technique?: string;
  solution_markdown?: string;
}

export interface RequiredHostLiveStatus {
  key: string;
  name: string;
  status: "running" | "stopped" | "unknown";
  ip: string;
}

export interface LabEnvironmentStatus {
  ready: boolean;
  required_hosts: RequiredHostLiveStatus[];
  required_index: string;
  bastion_ip: string;
}

export interface LabWorkspaceData {
  lab: LabItem;
  environment_status: LabEnvironmentStatus;
  phases: LabPhase[];
  evidence: EvidenceItem[];
  checklist: string[];
  notes: string;
  verdict: string;
  answers: Record<string, { selected_option: string; is_correct: boolean }>;
  raw_markdown: string;
}

export interface LabDetail extends LabItem {
  raw_markdown: string;
  rendered_html?: string;
  environment_status?: LabEnvironmentStatus;
  phases?: LabPhase[];
  evidence?: EvidenceItem[];
  checklist?: string[];
  verdict?: string;
  answers?: Record<string, { selected_option: string; is_correct: boolean }>;
}

export interface CurriculumStats {
  total_labs: number;
  completed: number;
  in_progress: number;
  not_started: number;
  percent_completed: number;
  level1: { total: number; completed: number };
  level2: { total: number; completed: number };
  level3: { total: number; completed: number };
  challenges: { total: number; completed: number };
  next_lab?: LabItem | null;
}

export interface ChallengeSolution {
  challenge_id: string;
  solution_markdown: string;
  solution_html: string;
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  level: string;
  mitre: string;
  score: number;
  snippet: string;
  url: string;
}

export interface AWSProfile {
  name: string;
  region: string;
  is_active: boolean;
  account_id?: string | null;
  status: "VALID" | "INVALID" | "UNCHECKED";
  error?: string | null;
}

export interface AutoStopStatus {
  enabled: boolean;
  grace_period_minutes: number;
  status: string;
  last_action?: string;
  consecutive_failures: number;
}

export interface SettingsConfig {
  app_name: string;
  app_version: string;
  aws_region: string;
  terraform_dir: string;
  ansible_dir: string;
  ssh_key_path: string;
  logs_dir: string;
  autostop: AutoStopStatus;
  profiles: AWSProfile[];
  ssh_info: {
    key_exists: boolean;
    key_path: string;
    public_key_preview?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  log_file?: string;
}
