.PHONY: all backend frontend install build clean help

# Default target - run both backend and frontend
all: help

# Run the backend server
backend:
	@echo "Starting backend server..."
	cd backend && go run main.go

# Run the frontend development server
frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

# Install frontend dependencies
install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Build both projects
build: build-backend build-frontend

# Build the backend
build-backend:
	@echo "Building backend..."
	cd backend && go build -o social main.go

# Build the frontend
build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build

# Run both backend and frontend concurrently (requires terminal multiplexing)
run:
	@echo "Starting both servers..."
	@echo "Run 'make backend' in one terminal and 'make frontend' in another"
	@echo "Or use: make run-parallel"

# Run both servers in parallel (background processes)
run-parallel:
	@echo "Starting backend and frontend in parallel..."
	@trap 'kill 0' SIGINT; \
	(cd backend && go run main.go) & \
	(cd frontend && npm run dev) & \
	wait

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f backend/social
	rm -rf frontend/dist
	rm -rf frontend/node_modules

# Show help
help:
	@echo "Available commands:"
	@echo "  make backend       - Run the backend server"
	@echo "  make frontend      - Run the frontend development server"
	@echo "  make run-parallel  - Run both servers in parallel"
	@echo "  make install       - Install frontend dependencies"
	@echo "  make build         - Build both projects"
	@echo "  make build-backend - Build the backend only"
	@echo "  make build-frontend- Build the frontend only"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make help          - Show this help message"
