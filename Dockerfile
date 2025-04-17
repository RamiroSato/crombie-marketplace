# Use Node.js 20 as base image
FROM node:23-alpine AS base

# Define build arguments
ARG DATABASE_URL
ARG JWT_SECRET
ARG GCP_STORAGE_BUCKET

# Set as environment variables for build process
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV GCP_STORAGE_BUCKET=$GCP_STORAGE_BUCKET


# Install dependencies only when needed
FROM base AS deps
WORKDIR /usr/app


# Install PM2 globally
RUN npm install --global pm2

# Copy "package.json" and "package-lock.json" before other files
# Utilise Docker cache to save re-installing dependencies if unchanged
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Change ownership to the non-root user
RUN chown -R node:node /usr/app

# Copy all files
COPY ./ ./

RUN npx prisma generate

# Run Prisma migrations
RUN npx prisma migrate deploy

# Build app
RUN npm run build

# Expose the listening port
EXPOSE 3000

# Run container as non-root (unprivileged) user
# The "node" user is provided in the Node.js Alpine base image
USER node

# Launch app with PM2
CMD [ "pm2-runtime", "start", "npm", "--", "run", "start" ]