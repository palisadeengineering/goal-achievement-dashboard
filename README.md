# Goal Achievement Dashboard

A comprehensive productivity and goal management application implementing Dan Martell's proven framework for optimizing time, energy, and focus.

## Features

### ✅ Implemented
- **Time & Energy Audit** - Track activities in 15-minute increments with energy levels and dollar values
- **Power Goals Management** - Manage up to 12 monthly goals with projects and next actions
- **Pomodoro Timer** - 25-minute focus sessions with 5-minute breaks
- **Scorecard Dashboard** - Track multiple metrics with daily, weekly, and monthly views

### 🚧 In Progress
- North Star Metric Tracker
- Accountability System
- Relationship Inventory
- Daily Planning Interface
- AI Insights
- Voice Capture

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, Wouter (routing)
- **Backend:** Express 4, tRPC 11
- **Database:** MySQL/TiDB with Drizzle ORM
- **UI Components:** shadcn/ui, Radix UI
- **Charts:** Recharts
- **Build Tool:** Vite
- **Testing:** Vitest

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL or TiDB database

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd goal-achievement-dashboard

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env and fill in your database credentials

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Development Commands

```bash
# Run dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check

# Build for production
pnpm build

# Start production server
pnpm start

# Database migration
pnpm db:push
```

## Project Structure

```
goal-achievement-dashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── index.css      # Global styles
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── _core/             # Framework code (don't modify)
│   ├── db.ts              # Database helpers
│   ├── routers.ts         # tRPC procedures
│   └── *.test.ts          # Unit tests
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database tables
└── shared/                # Shared types and constants
```

## Key Features

### Time & Energy Audit
- Select a date and add multiple 15-minute entries
- Auto-complete end time (+15 minutes)
- Sequential entry (next start time = previous end time)
- Smart activity autocomplete (learns from history)
- Color-coded energy levels (Red/Yellow/Green)
- Dollar value assignment ($-$$$$)
- Weekly, biweekly, and monthly summaries

### Power Goals
- Create up to 12 monthly goals
- Break down goals into projects
- Track next actions for each project
- Monitor completion status

### Pomodoro Timer
- 25-minute work sessions
- 5-minute break timer
- Session counter
- Task integration

### Scorecard Dashboard
- Track multiple metrics
- Daily, weekly, biweekly, monthly views
- Interactive line charts
- Color-coded status indicators
- Metric categories and filtering

## Testing

The project includes comprehensive unit tests for all features:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

Current test coverage:
- ✅ 30 tests passing (core features)
- ✅ 7 tests passing (scorecard)
- ✅ No TypeScript errors

## Database Schema

### Main Tables
- `users` - User authentication and profiles
- `timeAuditEntries` - Time tracking entries
- `powerGoals` - Monthly goals
- `projects` - Goal breakdown
- `pomodoroSessions` - Timer sessions
- `northStarMetrics` - Primary metric tracking
- `scorecardMetrics` - Multiple metrics dashboard
- `accountabilityPartners` - Accountability system
- `relationships` - Energy impact tracking
- `dailyPlans` - Planning interface

## Known Issues

⚠️ **Time Audit Entry Saving** - There's currently an intermittent issue where time audit entries may not save properly. This is being investigated. Workaround: Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R) if entries don't appear after submission.

## Contributing

This is a personal productivity tool. If you'd like to use it or contribute, feel free to fork the repository.

## License

MIT

## Author

Joel Heidema (joel@pe-se.com)

## Acknowledgments

Based on Dan Martell's productivity framework and goal achievement methodology.
