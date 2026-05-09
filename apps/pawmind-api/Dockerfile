FROM python:3.12-slim-bookworm
WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY src ./src

ENV PYTHONUNBUFFERED=1
EXPOSE 8010

CMD ["uv", "run", "uvicorn", "pawmind_api.main:app", "--host", "0.0.0.0", "--port", "8010", "--app-dir", "src"]
