# ==============================================================================
# THEDAL Control Plane — Multi-Mode Container Image
# Threat Hunting, Exploration, Detection, Analysis and Learn
# ==============================================================================

FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LC_ALL=C.UTF-8 \
    LANG=C.UTF-8 \
    THEDAL_MODE=docker \
    HOST=0.0.0.0 \
    PORT=8080

# 1. Install base utilities, OpenSSH client, curl, unzip, git, gnupg, procps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-client \
    curl \
    unzip \
    git \
    gnupg \
    procps \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Terraform
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bookworm main" > /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y --no-install-recommends terraform \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Ansible & Python Cloud Tools
RUN pip install --no-cache-dir ansible-core pywinrm boto3 botocore

# 4. Install AWS CLI v2
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip -q awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# 5. Create unprivileged operator user 'thedal'
RUN useradd -m -u 1000 -s /bin/bash thedal \
    && mkdir -p /workspace/control-plane /home/thedal/.ssh /home/thedal/.aws \
    && chown -R thedal:thedal /workspace /home/thedal

WORKDIR /workspace

# 6. Copy control plane code & project artifacts
COPY control-plane /workspace/control-plane
COPY Makefile /workspace/Makefile
COPY scripts /workspace/scripts
COPY terraform /workspace/terraform
COPY ansible /workspace/ansible
COPY docs /workspace/docs

# 7. Install control plane Python package
WORKDIR /workspace/control-plane
RUN pip install --no-cache-dir -e . \
    && chown -R thedal:thedal /workspace

USER thedal

EXPOSE 8080 8443

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
