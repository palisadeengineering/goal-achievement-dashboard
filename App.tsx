import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TimeAudit from "./pages/TimeAudit";
import PowerGoals from "./pages/PowerGoals";
import PomodoroTimer from "./pages/PomodoroTimer";
import NorthStarMetric from "./pages/NorthStarMetric";
import Scorecard from "./pages/Scorecard";
import Accountability from "./pages/Accountability";
import Relationships from "./pages/Relationships";
import DailyPlanning from "./pages/DailyPlanning";
import Insights from "./pages/Insights";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/time-audit" component={TimeAudit} />
      <Route path="/goals" component={PowerGoals} />
      <Route path="/pomodoro" component={PomodoroTimer} />
      <Route path="/north-star" component={NorthStarMetric} />
      <Route path="/scorecard" component={Scorecard} />
      <Route path="/accountability" component={Accountability} />
      <Route path="/relationships" component={Relationships} />
      <Route path="/daily-planning" component={DailyPlanning} />
      <Route path="/insights" component={Insights} />
      <Route path={" /404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
