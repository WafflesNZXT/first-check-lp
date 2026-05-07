FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_ROOT_USER_ACTION=ignore
ENV LIVE_AGENT_WORKER_HOST=0.0.0.0
ENV LIVE_AGENT_WORKER_PORT=8080
ENV LIVE_AGENT_POLL_JOBS=true

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc curl \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
  && python -m playwright install chromium --with-deps

COPY live_agent_worker.py ./live_agent_worker.py

RUN python -c "import live_agent_worker; print('live_agent_worker import ok')"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/ || exit 1

CMD ["uvicorn", "live_agent_worker:app", "--host", "0.0.0.0", "--port", "8080"]
