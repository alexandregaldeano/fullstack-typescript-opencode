# Fullstack TypeScript OpenCode Project

A fullstack TypeScript application with an Express backend and React frontend, containerized with Docker.

This is a test to see what OpenCode with a local Qwen 3.6 35B A3B is capable of under my supervision.

In an actual project, the `backend` and `frontend` subfolders would have their own Git repository.

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- Yarn package manager

## Development Setup

### Backend

```bash
cd backend
yarn install
yarn dev
```

The backend runs on port 3000 with hot reloading via `tsx watch`.

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

The frontend runs on port 5173 with hot reloading via Vite.

### Database

For development, use the Docker Compose dev configuration:

```bash
docker compose -f dev.docker-compose.yml up
```

This starts:
- Frontend on port 9090
- Backend on port 9091
- PostgreSQL database on port 9092

## Production Setup

### Docker

Build and run the full stack:

```bash
docker compose up --build
```

This starts:
- Frontend on port 5173 (via Nginx)
- Backend on port 9001
- PostgreSQL database on port 9002

### Manual Production Build

Build the backend:
```bash
cd backend
yarn build
```

Build the frontend:
```bash
cd frontend
yarn build
```

## Linting and Testing

### Backend

```bash
cd backend
yarn lint              # Run ESLint
yarn lint:fix          # Fix auto-fixable issues
yarn typecheck         # TypeScript type checking
yarn test              # Run tests in watch mode
yarn test:run          # Run tests once
yarn test:run --coverage # Run tests with coverage report
```

### Frontend

```bash
cd frontend
yarn lint              # Run ESLint
yarn lint:fix          # Fix auto-fixable issues
yarn typecheck         # TypeScript type checking
yarn test              # Run tests in watch mode
yarn test:run          # Run tests once
yarn test:run --coverage # Run tests with coverage report
```

### Git Hooks

Both projects use Husky and lint-staged for pre-commit hooks. Before committing:
- ESLint runs on staged files
- TypeScript type checking runs on staged files

## Nginx Proxy Configuration

The `nginx.conf` file configures the reverse proxy for production:

- Frontend requests are proxied to the frontend container
- API requests (`/api/`) are proxied to the backend container

To use the Nginx proxy:
1. Place the `nginx.conf` file in your Nginx configuration directory
2. Create a symlink to enable the site
3. Reload Nginx: `sudo nginx -s reload`

## Environment Variables

### Backend

Set the `DATABASE_URL` environment variable to connect to your PostgreSQL database.

### Frontend

Set the `VITE_API_URL` environment variable to specify the backend API URL. This is used by the frontend to make API calls.

## Troubleshooting

### Docker Issues

If containers fail to start, check the logs:
```bash
docker compose logs
```

### TypeScript Errors

Run the type checker to identify TypeScript errors:
```bash
yarn typecheck
```

### Linting Errors

Run the linter to identify code quality issues:
```bash
yarn lint
```
