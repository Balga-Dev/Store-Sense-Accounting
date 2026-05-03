# StoreSense Accounting

Enterprise multi-business SaaS accounting platform built with Node.js, Express, Prisma, PostgreSQL, and React.

## Architecture

```
store-sense/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, permissions, validation
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       └── seed.js          # Initialization script
├── frontend/                # Main accounting website (port 5173)
│   └── src/
│       ├── components/      # Shared components
│       ├── pages/           # Page components
│       ├── services/        # API client
│       └── store/           # State management
└── frontend-items/          # Item input website (port 5174)
    └── src/
```

## Features

- **Multi-tenant SaaS**: Complete business isolation with unique business codes
- **Super Admin**: Global control panel for managing all businesses
- **Role-based access**: Default roles (Manager, Supervisor, Cashier, Viewer) + fully customizable roles
- **Advanced permissions**: Tab visibility + action permissions with per-user overrides
- **Accounting**: Income/expense tracking with categories and daily auto-generated logs
- **Item management**: Business-specific items with unique codes, pricing, and categories
- **Reporting**: Financial summaries, trends, category breakdowns, CSV export
- **Activity logging**: Full audit trail of all user actions
- **Two websites**: Main accounting dashboard + dedicated item management portal

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Clone and install dependencies**
   ```bash
   cd store-sense
   npm install
   ```

2. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   The seed script creates:
   - Super Admin account (username: `superadmin`, password: `Admin@12345`)
   - Default roles with pre-configured permissions
   - Permission definitions for tabs and actions

   **IMPORTANT**: Change the Super Admin password immediately after first login.

4. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This starts:
   - Backend API on port 5000
   - Main frontend on port 5173
   - Items frontend on port 5174

### First Use

1. Login as Super Admin at `http://localhost:5173/login`
   - Business Code: (not required for super admin - use the super admin login via the admin panel)
   - Actually, super admin login is via the `/dashboard/admin` route after logging in as a business user with super admin role

2. Create a new business from the Super Admin dashboard
3. Note the generated business code (e.g., `SS-ABC12345`)
4. Create a business manager user for that business
5. Login as the business manager using the business code

## API Structure

### Authentication
- `POST /api/auth/login` - Business user login (requires businessCode, username, password)
- `POST /api/auth/super-admin/login` - Super admin login
- `POST /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Businesses (Super Admin only)
- `GET /api/businesses` - List all businesses
- `POST /api/businesses` - Create business
- `GET /api/businesses/:id` - Get business details
- `PUT /api/businesses/:id` - Update business
- `PATCH /api/businesses/:id/toggle-status` - Activate/deactivate
- `DELETE /api/businesses/:id` - Delete business

### Users
- `GET /api/users` - List users (business-scoped)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Activate/deactivate
- `POST /api/users/:id/reset-password` - Reset password
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:userId/tab-override` - Set tab permission override
- `PUT /api/users/:userId/action-override` - Set action permission override

### Roles
- `GET /api/roles` - List roles
- `POST /api/roles` - Create custom role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `PUT /api/roles/:id/tab-permissions` - Set tab permissions
- `PUT /api/roles/:id/action-permissions` - Set action permissions

### Items
- `GET /api/items` - List items (business-scoped)
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get financial summary

### Reports
- `GET /api/reports/dashboard` - Dashboard data
- `GET /api/reports/financial-summary` - Financial summary
- `GET /api/reports/trends` - Income/expense trends
- `GET /api/reports/category-breakdown` - Category analysis
- `GET /api/reports/daily-logs` - Daily financial logs
- `GET /api/reports/top-items` - Top selling items
- `GET /api/reports/export` - Export transactions as CSV
- `GET /api/reports/activity-logs` - User activity audit trail
- `GET /api/reports/notifications` - System notifications

## Security

- JWT authentication with token expiration
- bcrypt password hashing (12 salt rounds)
- Business-level data isolation enforced at middleware and database levels
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- Input validation
- Cross-business access prevention on all endpoints

## Permission System

### Tab Permissions (Visibility)
Controls which sections of the UI a user can see:
- Dashboard, Transactions, Reports, Items, Employees, Roles, Settings, etc.

### Action Permissions (Capabilities)
Controls what actions a user can perform:
- Create/Edit/Delete transactions, Manage employees, View reports, Export data, etc.

### Override System
- Roles define base permissions
- Managers can override any permission for individual users
- User overrides take precedence over role permissions

## Deployment

### Backend (VPS/Railway/Render)
```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm start
```

### Frontend (Vercel)
```bash
cd frontend
npm install
npm run build
```

### Items Frontend (Vercel)
```bash
cd frontend-items
npm install
npm run build
```

Set `VITE_API_URL` environment variable on both frontends to point to your backend URL.

## Environment Variables

### Backend
```
DATABASE_URL=postgresql://user:password@host:5432/storesense
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
PORT=5000
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend
```
VITE_API_URL=https://your-backend.com/api
```

## Default Credentials

After running `npm run db:seed`:
- **Super Admin**: username `superadmin`, password `Admin@12345`

Change these immediately after first login.
