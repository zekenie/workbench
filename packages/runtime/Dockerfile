# syntax=docker/dockerfile:1.4

# Build stage
FROM oven/bun:1.1.34-slim AS builder

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs --ingroup nodejs

# Set working directory for workspace root
WORKDIR /app

# Copy the entire workspace using named context
COPY --from=workspace --chown=bunjs:nodejs . .

# Install all dependencies from workspace root
RUN bun install

# Change to runtime package directory and build
WORKDIR /app/packages/runtime
RUN bun build --target bun ./src/index.ts --outdir ./dist

# Runtime stage
FROM oven/bun:1.1.34-slim

# Create data directory with wide open permissions for development
RUN mkdir -p /data && \
    chmod 777 /data

WORKDIR /app/packages/runtime

# Copy only the built bundle
COPY --from=builder /app/packages/runtime/dist ./dist

# Set production env
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

ENV PORT=3001
ENV CANVAS_ID=
ENV API_ID=
ENV API_SECRET=
ENV API_DOMAIN=
env SOURCE=/data/canvas.json

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun run curl -f http://localhost:3000/health || exit 1

# Start the app (modified to use the built file)
CMD ["bun", "dist/index.js"]