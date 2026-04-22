# 24Ghanta Nepal — News Portal

A full-stack news portal application with a separated frontend and backend architecture.

## Project Structure

```
24ghantanepal/
├── frontend/          # Next.js 16 frontend application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   ├── lib/           # Utilities, types, constants, data
│   └── public/        # Static assets
│
├── backend/           # Express.js REST API server
│   └── src/
│       ├── data/      # Data layer (mock data / DB)
│       ├── routes/    # API route handlers
│       ├── types/     # Shared TypeScript interfaces
│       └── server.ts  # Server entry point
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The API server will start at **http://localhost:5000**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Next.js app will start at **http://localhost:3000**

## API Endpoints

| Method | Endpoint                       | Description                     |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/api/articles`                | List articles (query: category, limit) |
| GET    | `/api/articles/featured`       | Get featured article            |
| GET    | `/api/articles/slugs`          | Get all article slugs           |
| GET    | `/api/articles/:slug`          | Get article by slug             |
| GET    | `/api/articles/:slug/related`  | Get related articles            |
| GET    | `/api/videos`                  | List videos (query: limit)      |
| GET    | `/api/videos/shorts`           | List short story videos         |
| GET    | `/api/categories`              | List all categories             |
| GET    | `/api/categories/:slug`        | Get category by slug            |
| GET    | `/api/polls`                   | List all polls                  |
| GET    | `/api/polls/active`            | Get active poll                 |
| GET    | `/api/polls/:id`               | Get poll by ID                  |
| GET    | `/health`                      | Health check                    |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Express.js, TypeScript, Node.js
# 24ghantanepal
