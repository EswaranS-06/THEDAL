# ==============================================================================
# SOCForge — Makefile (Phases 1–5)
# ==============================================================================

.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash

.PHONY: help preflight health-check lint tf-fmt tf-validate inventory ansible-syntax

help: ## Show this help message
	@echo "================================================================="
	@echo "                      SOCForge Developer CLI                    "
	@echo "================================================================="
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "================================================================="

preflight: ## Check control-machine prerequisite tools and resources
	@./scripts/preflight.sh

health-check: ## Verify local repository structure and integrity
	@./scripts/health-check.sh

lint: ## Check shell scripts, Python, Terraform, and Ansible for syntax errors
	@echo "Linting shell scripts..."
	@bash -n scripts/preflight.sh
	@bash -n scripts/health-check.sh
	@echo "Shell syntax verification: OK"
	@echo "Validating Python scripts..."
	@python3 -m py_compile scripts/generate-inventory.py
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
		echo "Ansible syntax verification: OK"; \
	fi

tf-fmt: ## Format Terraform configuration files
	@terraform -chdir=terraform fmt -recursive

tf-validate: ## Validate Terraform syntax and configuration
	@terraform -chdir=terraform validate

inventory: ## Generate Ansible hosts.ini from Terraform outputs
	@python3 scripts/generate-inventory.py

ansible-syntax: ## Validate syntax of all Ansible playbooks
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/bootstrap.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/linux-base.yml --syntax-check
	@ANSIBLE_CONFIG=ansible/ansible.cfg LC_ALL=C.UTF-8 ansible-playbook -i ansible/inventory/hosts.ini.example ansible/playbooks/windows-base.yml --syntax-check
