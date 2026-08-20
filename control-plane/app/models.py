"""
THEDAL Control Plane — Pydantic Data Models & Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class SystemStatus(BaseModel):
    aws_connected: bool
    aws_region: str
    terraform_status: str  # READY / DEPLOYED / DRIFT / ERROR / NOT_INITIALIZED
    ansible_status: str    # READY / RUNNING / ERROR
    environment_health: str # HEALTHY / DEGRADED / OFFLINE / UNKNOWN
    active_operation: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class EC2InstanceInfo(BaseModel):
    name: str
    instance_id: str
    instance_type: str
    state: str  # running, stopped, terminated, etc.
    private_ip: str
    public_ip: Optional[str] = None
    role: str
    availability_zone: str
    health: str  # PASS / FAIL / WARNING / UNKNOWN


class NetworkTopology(BaseModel):
    vpc_id: Optional[str] = None
    vpc_cidr: str = "10.10.0.0/16"
    subnets: List[Dict[str, Any]] = []
    nat_gateway_present: bool = False  # Should always be False for SOCForge


class OperationRequest(BaseModel):
    action: str
    target: Optional[str] = None
    confirmation: bool = False
    confirmation_phrase: Optional[str] = None


class OperationResponse(BaseModel):
    success: bool
    operation_id: str
    message: str
    status: str
    log_file: Optional[str] = None


class OperationLogEntry(BaseModel):
    timestamp: str
    operation: str
    operator: str = "local"
    status: str  # SUCCESS / FAILED / RUNNING
    exit_code: Optional[int] = None
    duration_seconds: Optional[float] = None
    log_file: str


class HealthCheckItem(BaseModel):
    component: str
    status: str  # PASS / FAIL / WARNING / UNKNOWN
    message: str
    details: Optional[str] = None


class HealthCheckSummary(BaseModel):
    overall_status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    checks: List[HealthCheckItem]


class LabProgressUpdate(BaseModel):
    lab_id: str
    status: Optional[str] = None
    notes: Optional[str] = None
    bookmarked: Optional[bool] = None
    current_step: Optional[int] = None


class EvidenceCreate(BaseModel):
    lab_id: str
    source: str
    event_id: Optional[str] = ""
    timestamp: Optional[str] = ""
    finding: str


class ChecklistUpdate(BaseModel):
    lab_id: str
    checklist: List[str]


class VerdictUpdate(BaseModel):
    lab_id: str
    verdict: str


class AnswerSubmit(BaseModel):
    lab_id: str
    question_id: str
    selected_option: str
    is_correct: bool


class StartRequiredHostsRequest(BaseModel):
    host_keys: List[str]


class ManagementIPStatus(BaseModel):
    detected_ip: Optional[str] = None
    configured_cidr: str
    effective_cidr: str
    status: str  # READY, MISMATCH, DRIFT, OPEN_ACCESS, UNKNOWN
    is_match: bool
    has_drift: bool
    live_bastion_ip: Optional[str] = None
    port_22_reachable: Optional[bool] = None
    access_mode: str = "automatic"  # automatic, custom, open
    last_sync_timestamp: Optional[str] = None
    previous_ip: Optional[str] = None
    aws_allowed_cidrs: List[str] = []
    message: str


class ManagementIPPreviewRequest(BaseModel):
    cidr: str


class ManagementIPApplyRequest(BaseModel):
    cidr: str
    mode: Optional[str] = "automatic"
    confirmation: bool = True
    understand_open_risk: Optional[bool] = False


class ConnectivityCheckRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = 22


class RuntimeModeStatus(BaseModel):
    mode: str  # native / docker
    display_name: str
    is_container: bool
    tools: Dict[str, Any]
    runtime_diagnostics: Dict[str, Any]
    network: Dict[str, Any]


class SimulationRunRequest(BaseModel):
    simulation_type: str  # atomic / web / baseline
    identifier: str       # e.g. T1082, DVWA-SQLI, BASELINE-AUTH
    confirmation: bool = True


class SimulationRunResponse(BaseModel):
    simulation_id: str
    simulation_type: str
    identifier: str
    name: str
    target: str
    status: str
    exit_code: int
    started_at: str
    completed_at: str
    log_file: Optional[str] = None
    output_preview: str
    expected_index: Optional[str] = None
    expected_events: List[str] = []
