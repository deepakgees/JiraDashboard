# Jira Dashboard Application

A comprehensive project management and tracking dashboard application, built with modern web technologies.

## 🚀 Features

- **Project Management**: Create, update, and track projects
- **Issue Tracking**: Manage bugs, features, and tasks
- **Sprint Planning**: Plan and track sprints
- **Team Management**: Assign tasks and track team performance
- **Real-time Updates**: Live dashboard updates
- **Responsive Design**: Modern, mobile-friendly interface
- **Advanced Analytics**: Charts and insights for project metrics

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **@headlessui/react** for accessible UI components
- **@heroicons/react** for beautiful icons
- **@tanstack/react-query** (v5) for data fetching and caching
- **React Router DOM** for client-side routing
- **Recharts** for data visualization
- **Create React App** for development and building

### Backend
- **Node.js** with TypeScript
- **Express.js** for API framework
- **Prisma** for database ORM
- **PostgreSQL** for database
- **Helmet** for security headers
- **Express Rate Limit** for API protection
- **bcryptjs** for password hashing
- **JWT** for authentication

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Nodemon** for backend development
- **Concurrently** for running both frontend and backend

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd jira-dashboard
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jiraDashboard"

# Server
PORT=4001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:4000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Jira API (optional for development)
JIRA_API_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your-api-token
```

### 4. Database Setup
```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed database with sample data
npm run db:seed
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:4001

## 📁 Project Structure

```
jira-dashboard/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── contexts/       # React contexts
│   ├── package.json
│   └── tailwind.config.js  # Tailwind CSS configuration
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── database/                # Database schema files
├── package.json            # Root package.json
└── README.md
```

## 🔧 Available Scripts

### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run install:all      # Install all dependencies
npm run build            # Build both frontend and backend
npm run test             # Run frontend tests
```

### Frontend
```bash
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests
npm run eject           # Eject from Create React App
```

### Backend
```bash
npm run dev             # Start development server
npm run build           # Build TypeScript
npm run start           # Start production server
npm run db:generate     # Generate Prisma client
npm run db:push         # Push database schema
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database
```

## 🔐 Security Features

- **RESTful API**: Clean and organized API endpoints
- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **API Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Security headers
- **Input Validation**: Express-validator for API validation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Issues
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

### Sprints
- `GET /api/sprints` - Get all sprints
- `POST /api/sprints` - Create new sprint
- `PUT /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint

## 🎨 UI Components

The application uses a modern design system with:
- **Tailwind CSS** for utility-first styling
- **Headless UI** for accessible components
- **Heroicons** for consistent iconography
- **Responsive design** for all screen sizes
- **Dark mode support** (planned)

## 🔄 Data Flow

1. **Frontend** makes API calls using React Query
2. **Backend** processes requests and validates data
3. **Prisma ORM** handles database operations
4. **Real-time updates** via polling every 30 seconds

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the build folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm run build
npm start
# Deploy to your server or cloud platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- The React and Node.js communities
- Tailwind CSS for the amazing styling framework
- Prisma for the excellent ORM
# JiraDashboard
