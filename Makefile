.PHONY: up down logs shell migrate test lint build \
        prod-up prod-down prod-build prod-logs prod-migrate prod-superuser

COMPOSE_PROD = docker compose -f docker-compose.prod.yml

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f backend celery_worker

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

shell:
	docker compose exec backend python manage.py shell_plus

test:
	docker compose exec backend python manage.py test --keepdb

createsuperuser:
	docker compose exec backend python manage.py createsuperuser

worker-logs:
	docker compose logs -f celery_worker celery_beat

lint:
	docker compose exec backend ruff check .

build:
	docker compose build

restart-backend:
	docker compose restart backend celery_worker celery_beat

rebuild-frontend:
	docker compose build frontend --no-cache && docker compose up -d frontend

rebuild-backend:
	docker compose build backend && docker compose up -d backend celery_worker celery_beat

rebuild-all:
	docker compose build && docker compose up -d

# --- Producción (EC2) ---
prod-build:
	$(COMPOSE_PROD) build

prod-up:
	$(COMPOSE_PROD) up -d

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f backend celery_worker nginx

prod-migrate:
	$(COMPOSE_PROD) exec backend python manage.py migrate

prod-superuser:
	$(COMPOSE_PROD) exec backend python manage.py createsuperuser

prod-restart:
	$(COMPOSE_PROD) restart backend celery_worker celery_beat nginx

prod-rebuild:
	$(COMPOSE_PROD) build && $(COMPOSE_PROD) up -d
