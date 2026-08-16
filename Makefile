# ==============================================================================
# SOCForge — Makefile (Phase 1)
# ==============================================================================

.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash

.PHONY: help preflight health-check lint

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

health-check: ## Verify local repository structure and integrity (Phase 1)
	@./scripts/health-check.sh

lint: ## Check shell scripts for syntax errors
	@echo "Linting shell scripts..."
	@bash -n scripts/preflight.sh
	@bash -n scripts/health-check.sh
	@echo "Shell syntax verification: OK"
