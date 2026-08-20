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
