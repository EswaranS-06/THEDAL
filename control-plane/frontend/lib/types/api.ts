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
}

export interface LabDetail extends LabItem {
  raw_markdown: string;
  rendered_html: string;
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
