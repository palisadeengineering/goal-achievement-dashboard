import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BarChart3, Plus, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type MetricStatus = "red" | "yellow" | "green";

export default function Scorecard() {
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [metricName, setMetricName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [status, setStatus] = useState<MetricStatus>("green");
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");

  const utils = trpc.useUtils();
  
  // Calculate date ranges
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: allMetrics, isLoading } = trpc.scorecard.list.useQuery({
    startDate: viewMode === "daily" ? today : viewMode === "weekly" ? weekAgo : monthAgo,
    endDate: today,
  });

  const createMetric = trpc.scorecard.create.useMutation({
    onSuccess: () => {
      utils.scorecard.list.invalidate();
      toast.success("Metric added to scorecard");
      setIsAddingMetric(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to add metric: " + error.message);
    },
  });

  const deleteMetric = trpc.scorecard.delete.useMutation({
    onSuccess: () => {
      utils.scorecard.list.invalidate();
      toast.success("Metric deleted");
    },
  });

  const resetForm = () => {
    setMetricName("");
    setCategory("");
    setUnit("");
    setTargetValue("");
    setCurrentValue("");
    setStatus("green");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMetric.mutate({
      metricName,
      category: category || undefined,
      unit,
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue),
      recordedDate: today,
      status,
    });
  };

  const getStatusBadgeClass = (metricStatus: string) => {
    switch (metricStatus) {
      case "red":
        return "bg-red-100 text-red-900 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
      case "yellow":
        return "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700";
      case "green":
        return "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      default:
        return "";
    }
  };

  const getStatusIcon = (metricStatus: string) => {
    switch (metricStatus) {
      case "red":
        return <TrendingDown className="h-4 w-4" />;
      case "yellow":
        return <Minus className="h-4 w-4" />;
      case "green":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Group metrics by name for trend analysis
  const metricsByName = allMetrics?.reduce((acc, metric) => {
    if (!acc[metric.metricName]) {
      acc[metric.metricName] = [];
    }
    acc[metric.metricName].push(metric);
    return acc;
  }, {} as Record<string, typeof allMetrics>);

  // Get unique metric names
  const uniqueMetricNames = metricsByName ? Object.keys(metricsByName) : [];

  // Prepare chart data for each metric
  const getChartData = (metricName: string) => {
    const metrics = metricsByName?.[metricName] || [];
    return metrics
      .sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
      .map((m) => ({
        date: new Date(m.recordedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "",
        current: m.currentValue,
        target: m.targetValue,
      }));
  };

  // Get latest metric for each unique name
  const latestMetrics = uniqueMetricNames.map((name) => {
    const metrics = metricsByName?.[name] || [];
    return metrics.sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime())[0];
  });

  // Calculate progress percentage
  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((current / target) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scorecard</h1>
            <p className="text-muted-foreground mt-2">
              Track multiple metrics with daily, weekly, and monthly views
            </p>
          </div>
          <Dialog open={isAddingMetric} onOpenChange={setIsAddingMetric}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Scorecard Metric</DialogTitle>
                <DialogDescription>
                  Track a new metric on your scorecard
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metricName">Metric Name</Label>
                    <Input
                      id="metricName"
                      value={metricName}
                      onChange={(e) => setMetricName(e.target.value)}
                      placeholder="e.g., Daily Active Users"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category (optional)</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Growth, Revenue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g., users, $, %"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.01"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="1000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentValue">Current Value</Label>
                    <Input
                      id="currentValue"
                      type="number"
                      step="0.01"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder="750"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">🟢 Green (On track)</SelectItem>
                      <SelectItem value="yellow">🟡 Yellow (At risk)</SelectItem>
                      <SelectItem value="red">🔴 Red (Off track)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddingMetric(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMetric.isPending}>
                    {createMetric.isPending ? "Adding..." : "Add Metric"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : latestMetrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestMetrics.map((metric) => (
                  <Card key={metric.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{metric.metricName}</CardTitle>
                          {metric.category && (
                            <CardDescription className="text-xs mt-1">{metric.category}</CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMetric.mutate({ id: metric.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{Number(metric.currentValue)}</span>
                          <span className="text-sm text-muted-foreground">/ {Number(metric.targetValue)} {metric.unit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadgeClass(metric.status || "green")}`}>
                            {getStatusIcon(metric.status || "green")}
                            {metric.status === "green" && "On track"}
                            {metric.status === "yellow" && "At risk"}
                            {metric.status === "red" && "Off track"}
                          </span>
                          <span className="text-sm font-medium">
                            {getProgress(Number(metric.currentValue), Number(metric.targetValue))}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              metric.status === "green"
                                ? "bg-green-600"
                                : metric.status === "yellow"
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${Math.min(getProgress(Number(metric.currentValue), Number(metric.targetValue)), 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No metrics yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start tracking metrics to monitor your progress
                  </p>
                  <Button onClick={() => setIsAddingMetric(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Metric
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : uniqueMetricNames.length > 0 ? (
              uniqueMetricNames.map((metricName) => {
                const chartData = getChartData(metricName);
                const latestMetric = metricsByName?.[metricName]?.[0];
                
                return (
                  <Card key={metricName}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{metricName}</CardTitle>
                          {latestMetric?.category && (
                            <CardDescription>{latestMetric.category}</CardDescription>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadgeClass(latestMetric?.status || "green")}`}>
                          {getStatusIcon(latestMetric?.status || "green")}
                          {latestMetric?.status === "green" && "On track"}
                          {latestMetric?.status === "yellow" && "At risk"}
                          {latestMetric?.status === "red" && "Off track"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="current"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name="Current"
                          />
                          <Line
                            type="monotone"
                            dataKey="target"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Target"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No weekly data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : uniqueMetricNames.length > 0 ? (
              uniqueMetricNames.map((metricName) => {
                const chartData = getChartData(metricName);
                const latestMetric = metricsByName?.[metricName]?.[0];
                
                return (
                  <Card key={metricName}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{metricName}</CardTitle>
                          {latestMetric?.category && (
                            <CardDescription>{latestMetric.category}</CardDescription>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusBadgeClass(latestMetric?.status || "green")}`}>
                          {getStatusIcon(latestMetric?.status || "green")}
                          {latestMetric?.status === "green" && "On track"}
                          {latestMetric?.status === "yellow" && "At risk"}
                          {latestMetric?.status === "red" && "Off track"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="current"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name="Current"
                          />
                          <Line
                            type="monotone"
                            dataKey="target"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Target"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No monthly data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
