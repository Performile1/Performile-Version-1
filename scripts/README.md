# Database Setup Scripts

This directory contains scripts for setting up and managing the Performile database.

## Prerequisites

- Node.js 22 or later
- npm or yarn
- Supabase project with PostgreSQL database

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

## Available Scripts

### Setup Database

Run the initial database setup, including schema creation and data seeding:

```bash
npm run setup-db
# or
yarn setup-db
```

### Run Migrations

Apply database migrations (if any):

```bash
npm run migrate
# or
yarn migrate
```

### Seed Database

Seed the database with test data:

```bash
npm run seed
# or
yarn seed
```

## Database Schema

The database schema is defined in the `../database/schema.sql` file. This includes all tables, functions, and triggers.

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key (for admin operations)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_REFRESH_SECRET`: Secret key for JWT refresh tokens
- `NODE_ENV`: Environment (development, production, etc.)

## Best Practices

- Always backup your database before running migrations or seed scripts
- Use migrations for database changes in production
- Never commit sensitive information to version control
- Use environment variables for all configuration

## Troubleshooting

If you encounter issues:

1. Check that your Supabase credentials are correct
2. Verify that your database is running and accessible
3. Check the error messages in the console
4. Ensure all required environment variables are set

For more information, refer to the main project README.
