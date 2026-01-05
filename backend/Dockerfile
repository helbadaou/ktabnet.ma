# Step 1: Build the binary
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o /godemo

# Step 2: Run the binary in a tiny image
FROM alpine:latest
WORKDIR /
COPY --from=builder /godemo /godemo
EXPOSE 8080
ENTRYPOINT ["/godemo"]