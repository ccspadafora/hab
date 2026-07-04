FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc curl \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-unifont \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/base.txt requirements/base.txt

FROM base AS development
COPY requirements/development.txt requirements/development.txt
RUN pip install --no-cache-dir -r requirements/development.txt
COPY . .
EXPOSE 8000

FROM base AS production
ARG INSTALL_PLAYWRIGHT_CHROMIUM=false
COPY requirements/production.txt requirements/production.txt
RUN pip install --no-cache-dir -r requirements/production.txt
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright
RUN if [ "$INSTALL_PLAYWRIGHT_CHROMIUM" = "true" ]; then playwright install chromium; fi
COPY . .
RUN adduser --disabled-password --gecos '' nonroot \
    && chown -R nonroot:nonroot /app
COPY docker-entrypoint.prod.sh /docker-entrypoint.prod.sh
RUN chmod +x /docker-entrypoint.prod.sh
EXPOSE 8000
