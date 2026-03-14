# CoreInventory

CoreInventory is a modern inventory management system built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io), and [Tailwind CSS](https://tailwindcss.com). It provides a comprehensive dashboard for managing products, operations, and inventory moves.

## Features

- **Dashboard**: Overview of key metrics and recent activities.
- **Operations**: Manage receipts, deliveries, internal transfers, and inventory adjustments.
- **Inventory Management**: Track products, view stock moves, and set up reordering rules.
- **Authentication**: Secure login and signup with NextAuth.js.
- **User Management**: Profile and settings management.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (via Prisma ORM) - easily switchable to PostgreSQL/MySQL
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Validation**: Zod
- **Forms**: React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd coreinventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory (or use the provided example) and add the following:

   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # SMTP Config for OTP emails (Optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

### Database Setup

1. Initialize the database and run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

2. Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
coreinventory/
+-- prisma/             # Database schema and seeds
+-- public/             # Static assets
+-- src/
|   +-- app/            # Next.js App Router pages and API routes
|   |   +-- (dashboard)/ # Protected dashboard routes
|   |   +-- api/        # Backend API endpoints
|   |   +-- login/      # Authentication pages
|   |   +-- ...
|   +-- components/     # Reusable UI components
|   |   +-- layout/     # specialized layout components (Sidebar, Header)
|   |   +-- ui/         # Shadcn/ui compatible components
|   +-- lib/            # Utility functions and configurations
+-- ...
```

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run db:seed`: Seeds the database with test data.
- `npm run db:reset`: Resets the database (caution: deletes all data).

## License

This project is open-source and available under the [MIT License](LICENSE).
