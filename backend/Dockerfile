FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/base.txt requirements/base.txt

FROM base AS development
COPY requirements/development.txt requirements/development.txt
RUN pip install --no-cache-dir -r requirements/development.txt
COPY . .
EXPOSE 8000

FROM base AS production
COPY requirements/production.txt requirements/production.txt
RUN pip install --no-cache-dir -r requirements/production.txt
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright
RUN playwright install --with-deps chromium
COPY . .
RUN adduser --disabled-password --gecos '' nonroot \
    && chown -R nonroot:nonroot /app
COPY docker-entrypoint.prod.sh /docker-entrypoint.prod.sh
RUN chmod +x /docker-entrypoint.prod.sh
USER nonroot
EXPOSE 8000
