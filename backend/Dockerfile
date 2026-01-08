# Step 1: Build with CGO for sqlite3
FROM golang:1.23-alpine AS builder
WORKDIR /app

# Install build deps for go-sqlite3
RUN apk add --no-cache build-base sqlite-dev

COPY go.mod go.sum ./
RUN go mod download
COPY . .

# Enable CGO so go-sqlite3 links against system sqlite
ENV CGO_ENABLED=1

# Build only the main package (./... would include multiple packages and fail with -o)
RUN go build -o /app/godemo .

# Step 2: Runtime image with sqlite libs only
FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache sqlite-libs
COPY --from=builder /app/godemo /app/godemo
# Ship migration files so golang-migrate can find them at runtime
COPY --from=builder /app/db /app/db
EXPOSE 8080
ENTRYPOINT ["/app/godemo"]