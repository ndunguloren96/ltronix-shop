# frontend/my-app/Dockerfile

# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

# Accept the NEXT_PUBLIC_DJANGO_API_URL as a build argument
ARG NEXT_PUBLIC_DJANGO_API_URL
# Set the environment variable for the build process
ENV NEXT_PUBLIC_DJANGO_API_URL=$NEXT_PUBLIC_DJANGO_API_URL

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package.lock.json ]; then npm ci; \
  else echo "No lock file found. Installing dependencies with npm install."; npm install; \
  fi

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# The build will now use the NEXT_PUBLIC_DJANGO_API_URL provided at build time
RUN npm run build

# Stage 2: Run the Next.js application in a minimal environment
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV production

# Copy necessary files from the builder stage
# These paths are relative to the WORKDIR of the builder stage (/app)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# It's usually better practice to copy minimal necessary node_modules,
# but for simplicity and to avoid missing runtime dependencies, copying all might be fine for development.
# If you want smaller images, research Next.js specific node_modules copying.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js runs on
EXPOSE 3000

# Command to run the Next.js application
CMD ["npm", "start"]
