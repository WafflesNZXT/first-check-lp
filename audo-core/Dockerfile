FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV LIVE_AGENT_WORKER_HOST=0.0.0.0
ENV LIVE_AGENT_WORKER_PORT=8001
ENV LIVE_AGENT_POLL_JOBS=true

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc curl \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
  && python -m playwright install chromium --with-deps

COPY live_agent_worker.py ./live_agent_worker.py

EXPOSE 8001

CMD ["uvicorn", "live_agent_worker:app", "--host", "0.0.0.0", "--port", "8001"]
