import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { 
  Target, 
  Clock, 
  TrendingUp, 
  Users, 
  Calendar, 
  Lightbulb,
  Timer,
  BarChart3,
  Heart
} from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="max-w-2xl text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Goal Achievement Dashboard</h1>
            <p className="text-xl text-muted-foreground">
              Master your time, energy, and focus with Dan Martell's proven framework
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">12 Power Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set and track your annual goals with clarity and focus
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Time & Energy Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Identify energy-draining activities and maximize productive time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Measure what matters with North Star metrics and scorecards
                </p>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Get Started</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || "there"}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's your productivity dashboard. Let's make 2026 your best year yet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/goals">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Power Goals</CardTitle>
                <CardDescription>Manage your 12 annual goals</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/time-audit">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Time & Energy Audit</CardTitle>
                <CardDescription>Track activities in 15-min increments</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/pomodoro">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Timer className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pomodoro Timer</CardTitle>
                <CardDescription>Focus with 25-minute work sessions</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/north-star">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>North Star Metric</CardTitle>
                <CardDescription>Track your primary success metric</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/scorecard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Scorecard</CardTitle>
                <CardDescription>Monitor multiple metrics daily</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/accountability">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Accountability</CardTitle>
                <CardDescription>Partners, commitments & check-ins</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/relationships">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Heart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Relationship Inventory</CardTitle>
                <CardDescription>Manage energy-giving connections</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/daily-planning">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Daily Planning</CardTitle>
                <CardDescription>Plan your first 90 minutes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/insights">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Lightbulb className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Get personalized recommendations</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
