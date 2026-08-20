# ==============================================================================
# THEDAL — Makefile
# Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================

.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash

.PHONY: help preflight health-check lint tf-fmt tf-validate tf-plan inventory ansible-syntax wazuh-deploy wazuh-tunnel wazuh-check wazuh-index-check detection-check windows-agent-deploy windows-check web-target-deploy web-check juice-shop-deploy juice-shop-check atomic-deploy atomic-check atomic-test web-attack-deploy web-attack-check web-test control-plane test-control-plane

help: ## Show this help message
	@echo "================================================================="
	@echo "                      THEDAL Developer CLI                      "
	@echo "================================================================="
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "================================================================="

preflight: ## Check control-machine prerequisite tools and resources
	@./scripts/preflight.sh

health-check: ## Verify local repository structure and integrity
	@./scripts/health-check.sh

lint: ## Check shell scripts, Python, Terraform, and Ansible for syntax errors
	@echo "Linting shell scripts..."
	@bash -n scripts/preflight.sh
	@bash -n scripts/health-check.sh
	@bash -n scripts/wazuh-tunnel.sh
	@bash -n scripts/wazuh-health-check.sh
	@bash -n scripts/wazuh-index-health-check.sh
	@bash -n scripts/detection-health-check.sh
	@bash -n scripts/windows-agent-health-check.sh
	@bash -n scripts/linux-web-health-check.sh
	@bash -n scripts/juice-shop-health-check.sh
	@bash -n scripts/run-atomic-test.sh
	@bash -n scripts/atomic-health-check.sh
	@bash -n scripts/run-web-test.sh
	@bash -n scripts/web-target-health-check.sh
	@echo "Shell syntax verification: OK"
	@echo "Validating Python scripts..."
	@python3 -m py_compile scripts/generate-inventory.py
	@python3 -m py_compile control-plane/app/config.py
	@python3 -m py_compile control-plane/app/models.py
	@python3 -m py_compile control-plane/app/main.py
	@python3 -m py_compile control-plane/app/services/terraform.py
	@python3 -m py_compile control-plane/app/services/ansible.py
	@python3 -m py_compile control-plane/app/services/aws.py
	@python3 -m py_compile control-plane/app/services/ssh.py
	@python3 -m py_compile control-plane/app/services/health.py
	@python3 -m py_compile control-plane/app/services/operations.py
	@echo "Python syntax verification: OK"
	@if command -v terraform >/dev/null 2>&1; then \
		echo "Validating Terraform formatting and syntax..."; \
		terraform -chdir=terraform fmt -check -recursive && \
		terraform -chdir=terraform validate && \
		echo "Terraform verification: OK"; \
	fi
	@if command -v ansible-playbook >/dev/null 2>&1; then \
		echo "Validating Ansible playbooks syntax..."; \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/bootstrap.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/linux-base.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/windows-base.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/wazuh.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/windows-agent.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/web-target.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/juice-shop.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/atomic-red-team.yml --syntax-check && \
		ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/web-attack.yml --syntax-check && \
		echo "Ansible syntax verification: OK"; \
	fi

tf-fmt: ## Format Terraform configuration files
	@terraform -chdir=terraform fmt -recursive

tf-validate: ## Validate Terraform syntax and configuration
	@terraform -chdir=terraform validate

tf-plan: ## Run Terraform dry-run execution plan
	@terraform -chdir=terraform plan

inventory: ## Generate Ansible hosts.ini from Terraform outputs
	@python3 scripts/generate-inventory.py

ansible-syntax: ## Validate syntax of all Ansible playbooks
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/bootstrap.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/linux-base.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/windows-base.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/wazuh.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/windows-agent.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/web-target.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/juice-shop.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/atomic-red-team.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/web-attack.yml --syntax-check

wazuh-deploy: ## Deploy the Wazuh SIEM platform via Ansible
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/wazuh.yml

wazuh-tunnel: ## Open SSH port forward tunnel to Wazuh Dashboard (https://localhost:8443)
	@./scripts/wazuh-tunnel.sh

wazuh-check: ## Check health and service status of Wazuh SIEM
	@./scripts/wazuh-health-check.sh

wazuh-index-check: ## Check telemetry routing, OpenSearch index templates, and ISM policies
	@./scripts/wazuh-index-health-check.sh

detection-check: ## Check custom decoders, detection rules, and positive/negative test suites
	@./scripts/detection-health-check.sh

windows-agent-deploy: ## Deploy Windows baseline, Sysmon, and Wazuh Agent
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/windows-agent.yml

windows-check: ## Check Windows endpoint telemetry and Wazuh Agent registration
	@./scripts/windows-agent-health-check.sh

web-target-deploy: ## Deploy Linux Web Target (Nginx :8000 + DVWA + MariaDB + Wazuh + auditd)
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/web-target.yml

web-check: ## Check Linux Web Target and DVWA health status
	@./scripts/linux-web-health-check.sh

juice-shop-deploy: ## Deploy OWASP Juice Shop Container on Port 3000
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/juice-shop.yml

juice-shop-check: ## Check OWASP Juice Shop container and port 3000 status
	@./scripts/juice-shop-health-check.sh

atomic-deploy: ## Deploy Atomic Red Team Simulation Framework on SOCForge-attack
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/atomic-red-team.yml

atomic-check: ## Check health and catalog status of Atomic Red Team attack simulation host
	@./scripts/atomic-health-check.sh

atomic-test: ## Run controlled Atomic Red Team simulation test (Usage: make atomic-test ARGS="--list")
	@./scripts/run-atomic-test.sh $(ARGS)

web-attack-deploy: ## Deploy Web Security Testing Suite on SOCForge-attack
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/web-attack.yml

web-attack-check: ## Check health and scenario status of Web Security Testing Suite
	@./scripts/web-target-health-check.sh

web-test: ## Run controlled Web Security Testing scenario (Usage: make web-test ARGS="--list")
	@./scripts/run-web-test.sh $(ARGS)

control-plane: ## Start full E2E control plane (Frontend + Backend)
	@echo "Starting THEDAL Control Plane (Backend + Frontend)..."
	@chmod +x scripts/start-control-plane.sh
	@./scripts/start-control-plane.sh

control-plane-backend: ## Start local FastAPI backend server on 0.0.0.0:8080
	@echo "Starting FastAPI backend..."
	@cd control-plane && /home/rex/.local/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port 8080

control-plane-frontend: ## Start Next.js frontend dev server on 0.0.0.0:3000
	@echo "Starting Next.js frontend (dev)..."
	@cd control-plane/frontend && npm run dev -- -H 0.0.0.0

control-plane-frontend-build: ## Build Next.js frontend
	@echo "Building Next.js frontend..."
	@cd control-plane/frontend && npm run build

control-plane-frontend-start: ## Start Next.js frontend production server on 0.0.0.0:3000
	@echo "Starting Next.js frontend (production)..."
	@cd control-plane/frontend && npm start -- -H 0.0.0.0

test-control-plane: ## Run pytest test suite on control-plane
	@cd control-plane && /home/rex/.local/bin/uv run pytest tests/ -v

test-frontend-e2e: ## Run Playwright E2E tests for Next.js frontend
	@cd control-plane/frontend && npm run test:e2e
