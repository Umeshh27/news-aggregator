# HackerPulse — High-Performance News Aggregator

A React-based news aggregator that fetches and displays top stories from the [Hacker News API](https://github.com/HackerNews/API). This project demonstrates web performance engineering — starting from a deliberately unoptimized baseline and systematically optimizing for Core Web Vitals (LCP, INP, CLS).

## Features

- 📰 Displays top 500 stories from HackerNews
- 🔍 Filter articles by title
- 🔥 Sort articles by score
- 🎨 Premium dark UI with glassmorphism design
- ⚡ Performance-optimized with virtualization and code splitting
- 🐳 Docker containerized for production deployment

## Tech Stack

| Technology                  | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| **React 19**                | UI framework                                         |
| **Vite 8**                  | Build tool & dev server                              |
| **@tanstack/react-virtual** | List virtualization for rendering only visible items |
| **Lodash**                  | Utility functions (cherry-picked imports)            |
| **Docker + Nginx**          | Production containerized deployment                  |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Docker** and **Docker Compose** (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd news-aggregator

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running Locally (Development)

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Running with Docker

```bash
docker-compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Branch Structure

| Branch         | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `main`         | ✅ Fully optimized version with all performance improvements            |
| `slow-version` | 🐢 Intentionally unoptimized version demonstrating common anti-patterns |

### Running the Slow Version

```bash
git checkout slow-version
npm install
npm run dev
```

### Running the Optimized Version

```bash
git checkout main
npm install
npm run dev
```

---

## Performance Optimizations

For detailed before/after metrics and analysis, see [PERFORMANCE.md](PERFORMANCE.md).

### Summary

| #   | Optimization                      | Details                                                          |
| --- | --------------------------------- | ---------------------------------------------------------------- |
| 1   | **Parallelized Network Requests** | `Promise.all` instead of sequential fetching                     |
| 2   | **List Virtualization**           | `@tanstack/react-virtual` renders only visible items             |
| 3   | **Cherry-picked Lodash**          | `import sortBy from 'lodash/sortBy'` instead of the full library |
| 4   | **Memoized Computations**         | `React.memo`, `useMemo` for expensive operations                 |
| 5   | **Optimized Images**              | `width`, `height`, `srcset`, WebP format                         |
| 6   | **Code Splitting**                | `React.lazy` + `Suspense` for on-demand loading                  |

---

## Building for Production

```bash
# Build the production bundle
npm run build

# Preview the production build
npm run preview

# Bundle analysis report (stats.html) is auto-generated during build
```

---

## Project Structure

```
news-aggregator/
├── public/              # Static assets (images, icons)
├── src/
│   ├── main.jsx         # Application entry point
│   ├── App.jsx          # Root component with data fetching & UI
│   ├── App.css          # Component styles
│   └── index.css        # Global styles & design tokens
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Docker Compose configuration
├── nginx.conf           # Nginx config for production serving
├── vite.config.js       # Vite build configuration
└── package.json         # Dependencies & scripts
```
