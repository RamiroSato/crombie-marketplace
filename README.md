# Crombie Marketplace

A full-stack e-commerce platform built with Next.js and TypeScript where users can purchase customizable products like t-shirts, mugs, and posters.


### Prerequisites

- Node.js 18+ and npm
- MS SQL Server instance (or use Docker)
- Google Cloud account (for production deployment)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crombie-marketplace.git
   cd crombie-marketplace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (use `.env.example` as a template):
   ```
   # Database Connection
   DATABASE_URL="mysql://username:password@localhost:3306/crombie_marketplace"
   
   # JWT Authentication
   JWT_SECRET="your-jwt-secret-min-32-chars-long"
   
   # Google Cloud (for production)
   GOOGLE_APPLICATION_CREDENTIALS="./gcp-credentials.json"
   GCP_PROJECT="your-gcp-project-id"
   GCP_STORAGE_BUCKET="your-storage-bucket-name"
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Create the database and run migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Seed the database with initial data:
   ```bash
   npx prisma db seed
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Create a production build:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Docker Deployment

Build and run with Docker:
```bash
# Build the Docker image
npm run docker:build

# Run the Docker container
npm run docker:run
```

## Google Cloud Platform Setup

### Cloud SQL

1. Create a Cloud SQL instance with MS SQL Server
2. Configure the connection in your `.env` file

### Cloud Storage

1. Create a storage bucket for product images
2. Create a service account with Storage Admin role
3. Download the service account key and save it as `gcp-credentials.json`

### Cloud Run

Deploy the container to Cloud Run using the GitHub Actions workflow.

## Project Structure

- `/app`: Next.js App Router pages and API routes
- `/components`: React components organized by feature
- `/lib`: Utility functions and shared code
- `/prisma`: Database schema and migrations
- `/public`: Static assets

## Default Admin Access

After seeding the database, you can log in with:
- Email: `admin@example.com`
- Password: `Admin123!`
