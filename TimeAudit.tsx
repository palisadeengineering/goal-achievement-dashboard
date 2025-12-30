import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TimeAudit() {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [lastEndTime, setLastEndTime] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const [description, setDescription] = useState("");
  const [energyLevel, setEnergyLevel] = useState<"red" | "yellow" | "green">("green");
  const [dollarValue, setDollarValue] = useState<number>(2);
  const [category, setCategory] = useState("");
  const [viewMode, setViewMode] = useState<"entries" | "weekly" | "biweekly" | "monthly">("entries");

  const utils = trpc.useUtils();
  const { data: allEntries, isLoading } = trpc.timeAudit.list.useQuery({});
  
  const createEntry = trpc.timeAudit.create.useMutation({
    onSuccess: () => {
      utils.timeAudit.list.invalidate();
      toast.success("Time audit entry added");
      // Set next start time to current end time for seamless consecutive entries
      const nextStartTime = endTime;
      resetForm();
      setStartTime(nextStartTime);
      // Keep dialog open for quick successive entries
    },
    onError: (error) => {
      toast.error("Failed to add entry: " + error.message);
    },
  });

  const deleteEntry = trpc.timeAudit.delete.useMutation({
    onSuccess: () => {
      utils.timeAudit.list.invalidate();
      toast.success("Entry deleted");
    },
  });

  // Auto-complete end time when start time changes (15-minute increment)
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Add 15 minutes
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
      const endHours = endDate.getHours().toString().padStart(2, "0");
      const endMinutes = endDate.getMinutes().toString().padStart(2, "0");
      
      setEndTime(`${endHours}:${endMinutes}`);
    }
  }, [startTime]);

  // Get unique activity descriptions from previous entries for autocomplete
  const activitySuggestions = useMemo(() => {
    if (!allEntries) return [];
    
    const uniqueActivities = new Set<string>();
    allEntries.forEach((entry) => {
      if (entry.description) {
        uniqueActivities.add(entry.description);
      }
    });
    
    return Array.from(uniqueActivities).sort();
  }, [allEntries]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!description) return activitySuggestions;
    
    const searchTerm = description.toLowerCase();
    return activitySuggestions.filter((activity) =>
      activity.toLowerCase().includes(searchTerm)
    );
  }, [description, activitySuggestions]);

  // Filter entries for selected date
  const entriesForSelectedDate = useMemo(() => {
    if (!allEntries) return [];
    return allEntries.filter((entry) => {
      const entryDate = new Date(entry.activityDate).toISOString().split("T")[0];
      return entryDate === selectedDate;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allEntries, selectedDate]);

  // Update last end time whenever entries change
  useEffect(() => {
    if (entriesForSelectedDate.length > 0) {
      const lastEntry = entriesForSelectedDate[entriesForSelectedDate.length - 1];
      setLastEndTime(lastEntry.endTime);
    } else {
      setLastEndTime("");
    }
  }, [entriesForSelectedDate]);

  // When dialog opens, set start time to last entry's end time
  useEffect(() => {
    if (isAddingEntry && lastEndTime && !startTime) {
      setStartTime(lastEndTime);
    }
  }, [isAddingEntry, lastEndTime]);

  // Calculate summary data
  const summaryData = useMemo(() => {
    if (!allEntries) return null;

    const now = new Date();
    const getDateRange = (type: "weekly" | "biweekly" | "monthly") => {
      const end = new Date(now);
      const start = new Date(now);
      
      if (type === "weekly") {
        start.setDate(start.getDate() - 7);
      } else if (type === "biweekly") {
        start.setDate(start.getDate() - 14);
      } else {
        start.setDate(start.getDate() - 30);
      }
      
      return { start, end };
    };

    const calculateSummary = (type: "weekly" | "biweekly" | "monthly") => {
      const { start, end } = getDateRange(type);
      const filtered = allEntries.filter((entry) => {
        const entryDate = new Date(entry.activityDate);
        return entryDate >= start && entryDate <= end;
      });

      const energyCounts = { red: 0, yellow: 0, green: 0 };
      const dollarTotals = { 1: 0, 2: 0, 3: 0, 4: 0 };
      let totalMinutes = 0;

      filtered.forEach((entry) => {
        energyCounts[entry.energyLevel as keyof typeof energyCounts]++;
        dollarTotals[entry.dollarValue as keyof typeof dollarTotals]++;
        
        // Calculate duration
        const [startH, startM] = entry.startTime.split(":").map(Number);
        const [endH, endM] = entry.endTime.split(":").map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        totalMinutes += duration;
      });

      return {
        totalEntries: filtered.length,
        totalHours: (totalMinutes / 60).toFixed(1),
        energyCounts,
        dollarTotals,
      };
    };

    return {
      weekly: calculateSummary("weekly"),
      biweekly: calculateSummary("biweekly"),
      monthly: calculateSummary("monthly"),
    };
  }, [allEntries]);

  const resetForm = () => {
    setStartTime("");
    setEndTime("");
    setDescription("");
    setEnergyLevel("green");
    setDollarValue(2);
    setCategory("");
    setShowActivitySuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called with:', { selectedDate, startTime, endTime, description, energyLevel, dollarValue, category });
    createEntry.mutate({
      activityDate: selectedDate,
      startTime,
      endTime,
      description,
      energyLevel,
      dollarValue,
      category: category || undefined,
    });
  };

  const getEnergyBadgeClass = (level: string) => {
    switch (level) {
      case "red":
        return "energy-red";
      case "yellow":
        return "energy-yellow";
      case "green":
        return "energy-green";
      default:
        return "";
    }
  };

  const getDollarDisplay = (value: number) => {
    return "$".repeat(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Time & Energy Audit</h1>
            <p className="text-muted-foreground mt-2">
              Track your activities in 15-minute increments to identify energy patterns
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
            <CardDescription>Choose a date to view or add entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
              <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry for {new Date(selectedDate + "T00:00:00").toLocaleDateString()}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Time Audit Entry</DialogTitle>
                    <DialogDescription>
                      Recording for {new Date(selectedDate + "T00:00:00").toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category (optional)</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Work, Personal"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Activity Description</Label>
                      <Popover open={showActivitySuggestions && filteredSuggestions.length > 0 && description.length > 0} onOpenChange={setShowActivitySuggestions}>
                        <PopoverTrigger asChild>
                          <div>
                            <Textarea
                              id="description"
                              value={description}
                              onChange={(e) => {
                                setDescription(e.target.value);
                                if (e.target.value.length > 0) {
                                  setShowActivitySuggestions(true);
                                } else {
                                  setShowActivitySuggestions(false);
                                }
                              }}
                              onBlur={() => {
                                // Delay closing to allow click on suggestion
                                setTimeout(() => setShowActivitySuggestions(false), 200);
                              }}
                              placeholder="What did you do during this time? (Start typing for suggestions)"
                              required
                              className="min-h-[80px]"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                          <Command>
                            <CommandList>
                              <CommandEmpty>No previous activities found.</CommandEmpty>
                              <CommandGroup heading="Previous Activities">
                                {filteredSuggestions.slice(0, 10).map((activity, index) => (
                                  <CommandItem
                                    key={index}
                                    value={activity}
                                    onSelect={() => {
                                      setDescription(activity);
                                      setShowActivitySuggestions(false);
                                    }}
                                  >
                                    {activity}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="energyLevel">Energy Level</Label>
                        <Select value={energyLevel} onValueChange={(v: any) => setEnergyLevel(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">🟢 Green (Energizing)</SelectItem>
                            <SelectItem value="yellow">🟡 Yellow (Neutral)</SelectItem>
                            <SelectItem value="red">🔴 Red (Draining)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dollarValue">Dollar Value</Label>
                        <Select value={dollarValue.toString()} onValueChange={(v) => setDollarValue(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">$ (Low value)</SelectItem>
                            <SelectItem value="2">$$ (Medium value)</SelectItem>
                            <SelectItem value="3">$$$ (High value)</SelectItem>
                            <SelectItem value="4">$$$$ (Critical value)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsAddingEntry(false);
                        resetForm();
                      }}>
                        Close
                      </Button>
                      <Button 
                        type="button"
                        disabled={createEntry.isPending}
                        onClick={() => {
                          console.log('=== Button onClick fired ===');
                          console.log('Description:', description);
                          console.log('Start Time:', startTime);
                          console.log('End Time:', endTime);
                          
                          if (!description.trim()) {
                            console.log('ERROR: No description');
                            toast.error('Please enter an activity description');
                            return;
                          }
                          
                          const mutationData = {
                            activityDate: selectedDate,
                            startTime,
                            endTime,
                            description,
                            energyLevel,
                            dollarValue,
                            category: category || undefined,
                          };
                          
                          console.log('Calling createEntry.mutate with:', mutationData);
                          createEntry.mutate(mutationData);
                          console.log('createEntry.mutate called');
                        }}
                      >
                        {createEntry.isPending ? "Adding..." : "Add Entry"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Entries and Summaries */}
        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
          <TabsList>
            <TabsTrigger value="entries">Daily Entries</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
            <TabsTrigger value="biweekly">Biweekly Summary</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Loading entries...</p>
                </CardContent>
              </Card>
            ) : entriesForSelectedDate.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No entries for {new Date(selectedDate + "T00:00:00").toLocaleDateString()}. Click "Add Entry" to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {entriesForSelectedDate.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {entry.startTime} - {entry.endTime}
                            </span>
                            {entry.category && (
                              <span className="text-sm text-muted-foreground">• {entry.category}</span>
                            )}
                          </div>
                          <p className="text-sm mb-3">{entry.description}</p>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEnergyBadgeClass(entry.energyLevel)}`}>
                              {entry.energyLevel === "green" && "🟢 Energizing"}
                              {entry.energyLevel === "yellow" && "🟡 Neutral"}
                              {entry.energyLevel === "red" && "🔴 Draining"}
                            </span>
                            <span className="text-sm font-medium">
                              {getDollarDisplay(entry.dollarValue)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEntry.mutate({ id: entry.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            {summaryData && (
              <Card>
                <CardHeader>
                  <CardTitle>Last 7 Days Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold">{summaryData.weekly.totalEntries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{summaryData.weekly.totalHours}h</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Energy Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🟢 Energizing</span>
                        <span className="font-semibold">{summaryData.weekly.energyCounts.green}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🟡 Neutral</span>
                        <span className="font-semibold">{summaryData.weekly.energyCounts.yellow}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🔴 Draining</span>
                        <span className="font-semibold">{summaryData.weekly.energyCounts.red}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Value Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$$$ Critical</span>
                        <span className="font-semibold">{summaryData.weekly.dollarTotals[4]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$$ High</span>
                        <span className="font-semibold">{summaryData.weekly.dollarTotals[3]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$ Medium</span>
                        <span className="font-semibold">{summaryData.weekly.dollarTotals[2]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$ Low</span>
                        <span className="font-semibold">{summaryData.weekly.dollarTotals[1]}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="biweekly">
            {summaryData && (
              <Card>
                <CardHeader>
                  <CardTitle>Last 14 Days Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold">{summaryData.biweekly.totalEntries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{summaryData.biweekly.totalHours}h</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Energy Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🟢 Energizing</span>
                        <span className="font-semibold">{summaryData.biweekly.energyCounts.green}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🟡 Neutral</span>
                        <span className="font-semibold">{summaryData.biweekly.energyCounts.yellow}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🔴 Draining</span>
                        <span className="font-semibold">{summaryData.biweekly.energyCounts.red}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Value Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$$$ Critical</span>
                        <span className="font-semibold">{summaryData.biweekly.dollarTotals[4]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$$ High</span>
                        <span className="font-semibold">{summaryData.biweekly.dollarTotals[3]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$ Medium</span>
                        <span className="font-semibold">{summaryData.biweekly.dollarTotals[2]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$ Low</span>
                        <span className="font-semibold">{summaryData.biweekly.dollarTotals[1]}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="monthly">
            {summaryData && (
              <Card>
                <CardHeader>
                  <CardTitle>Last 30 Days Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold">{summaryData.monthly.totalEntries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{summaryData.monthly.totalHours}h</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Energy Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🟢 Energizing</span>
                        <span className="font-semibold">{summaryData.monthly.energyCounts.green}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🟡 Neutral</span>
                        <span className="font-semibold">{summaryData.monthly.energyCounts.yellow}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">🔴 Draining</span>
                        <span className="font-semibold">{summaryData.monthly.energyCounts.red}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Value Distribution</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$$$ Critical</span>
                        <span className="font-semibold">{summaryData.monthly.dollarTotals[4]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$$ High</span>
                        <span className="font-semibold">{summaryData.monthly.dollarTotals[3]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$$ Medium</span>
                        <span className="font-semibold">{summaryData.monthly.dollarTotals[2]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$ Low</span>
                        <span className="font-semibold">{summaryData.monthly.dollarTotals[1]}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
