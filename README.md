# Smart Parking — Frontend

A minimalist React frontend for the Smart Parking management API.
Built as part of a graduation project.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Fetch API | HTTP calls to the backend |
| CSS (vanilla) | Greyscale design system, no CSS framework |

---

## Project Structure

```
src/
├── api/
│   └── client.js          # All API calls in one place
├── components/
│   ├── Layout.js          # App shell (topbar + outlet)
│   ├── Sidebar.js         # Navigation sidebar
│   └── UI.js              # Reusable components (Modal, StatCard, SpotGrid…)
├── context/
│   └── AuthContext.js     # JWT auth state, login/logout
├── pages/
│   ├── Login.js           # Login page (all roles)
│   ├── admin/
│   │   ├── Dashboard.js   # Admin overview + live stats
│   │   ├── Lots.js        # Lot & spot management
│   │   ├── Tickets.js     # Issue / search / close tickets
│   │   ├── Tariffs.js     # Tariff configuration
│   │   ├── Revenue.js     # Today's revenue + date range report
│   │   └── Users.js       # User management
│   ├── attendant/
│   │   ├── Dashboard.js   # Attendant overview
│   │   ├── Tickets.js     # Issue & close tickets
│   │   └── SpotMap.js     # Live spot availability map
│   └── viewer/
│       └── index.js       # Read-only overview + spot map
├── styles/
│   └── global.css         # Design system (colours, typography, components)
├── App.js                 # Routes + role-based auth guards
└── index.js               # React entry point
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Your ParkingAPI backend running (default: `http://localhost:5162`)

### Install & run

```bash
npm install
npm start
```

The app opens at **http://localhost:3000**.

### Build for production

```bash
npm run build
```

---

## Role-based Routing

| Role | Route | Pages |
|------|-------|-------|
| Admin | `/admin/*` | Dashboard, Lots, Tickets, Tariffs, Revenue, Users |
| Attendant | `/attendant/*` | Dashboard, Tickets, Spot Map |
| Viewer | `/viewer/*` | Overview, Spot Map |

After login the app reads the `role` claim from the JWT and redirects automatically.

---

## Design System

- **Palette**: Greyscale only — `#0d0d0d` → `#f5f5f5`
- **Fonts**: Space Grotesk (headings) + Inter (body)
- **Sidebar**: Dark (`#1a1a1a`) with white nav links
- **Cards**: White on light grey background (`#f2f2f0`)
- **Status colours**: Muted green / red / amber — used only for badges
