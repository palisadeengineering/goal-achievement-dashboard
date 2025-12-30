import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Time audit entries - track activities in 15-minute increments
 */
export const timeAuditEntries = mysqlTable("time_audit_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  activityDate: date("activityDate").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(),
  description: text("description").notNull(),
  energyLevel: mysqlEnum("energyLevel", ["red", "yellow", "green"]).notNull(),
  dollarValue: int("dollarValue").notNull(), // 1-4 representing $-$$$$
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeAuditEntry = typeof timeAuditEntries.$inferSelect;
export type InsertTimeAuditEntry = typeof timeAuditEntries.$inferInsert;

/**
 * Power Goals - up to 12 annual goals
 */
export const powerGoals = mysqlTable("power_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetMonth: int("targetMonth"), // 1-12
  targetYear: int("targetYear"),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PowerGoal = typeof powerGoals.$inferSelect;
export type InsertPowerGoal = typeof powerGoals.$inferInsert;

/**
 * Projects - breakdown of power goals
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  goalId: int("goalId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Next Actions - specific tasks for projects
 */
export const nextActions = mysqlTable("next_actions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NextAction = typeof nextActions.$inferSelect;
export type InsertNextAction = typeof nextActions.$inferInsert;

/**
 * Pomodoro Sessions - track focused work sessions
 */
export const pomodoroSessions = mysqlTable("pomodoro_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  duration: int("duration").notNull(), // in seconds (typically 1500 for 25 min)
  taskDescription: text("taskDescription"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = typeof pomodoroSessions.$inferInsert;

/**
 * North Star Metrics - primary goal metric tracking
 */
export const northStarMetrics = mysqlTable("north_star_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).notNull(),
  recordedDate: date("recordedDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NorthStarMetric = typeof northStarMetrics.$inferSelect;
export type InsertNorthStarMetric = typeof northStarMetrics.$inferInsert;

/**
 * Scorecard Metrics - multiple metrics tracking
 */
export const scorecardMetrics = mysqlTable("scorecard_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).notNull(),
  recordedDate: date("recordedDate").notNull(),
  status: mysqlEnum("status", ["red", "yellow", "green"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScorecardMetric = typeof scorecardMetrics.$inferSelect;
export type InsertScorecardMetric = typeof scorecardMetrics.$inferInsert;

/**
 * Accountability Partners
 */
export const accountabilityPartners = mysqlTable("accountability_partners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  partnerName: varchar("partnerName", { length: 255 }).notNull(),
  partnerEmail: varchar("partnerEmail", { length: 320 }),
  partnerPhone: varchar("partnerPhone", { length: 50 }),
  relationship: varchar("relationship", { length: 100 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountabilityPartner = typeof accountabilityPartners.$inferSelect;
export type InsertAccountabilityPartner = typeof accountabilityPartners.$inferInsert;

/**
 * Commitments - public commitments with accountability
 */
export const commitments = mysqlTable("commitments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  partnerId: int("partnerId"),
  goalId: int("goalId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadline: date("deadline"),
  stakes: text("stakes"), // consequences if not achieved
  status: mysqlEnum("status", ["active", "completed", "failed"]).default("active").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = typeof commitments.$inferInsert;

/**
 * Check-ins - scheduled accountability check-ins
 */
export const checkIns = mysqlTable("check_ins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  partnerId: int("partnerId"),
  commitmentId: int("commitmentId"),
  scheduledDate: date("scheduledDate").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Relationship Inventory - categorize contacts by energy impact
 */
export const relationships = mysqlTable("relationships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 100 }),
  energyImpact: mysqlEnum("energyImpact", ["red", "yellow", "green"]).notNull(),
  notes: text("notes"),
  boundarySet: boolean("boundarySet").default(false).notNull(),
  lastInteraction: date("lastInteraction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = typeof relationships.$inferInsert;

/**
 * Daily Plans - evening and weekly planning
 */
export const dailyPlans = mysqlTable("daily_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planDate: date("planDate").notNull(),
  first90MinTask: text("first90MinTask"),
  keyTasks: text("keyTasks"), // JSON array of tasks
  notes: text("notes"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyPlan = typeof dailyPlans.$inferSelect;
export type InsertDailyPlan = typeof dailyPlans.$inferInsert;

/**
 * Goal Review Reminders - track 3x daily goal reviews
 */
export const goalReviews = mysqlTable("goal_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reviewDate: date("reviewDate").notNull(),
  reviewTime: mysqlEnum("reviewTime", ["morning", "afternoon", "evening"]).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GoalReview = typeof goalReviews.$inferSelect;
export type InsertGoalReview = typeof goalReviews.$inferInsert;

/**
 * AI Insights - generated recommendations and analysis
 */
export const aiInsights = mysqlTable("ai_insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  insightType: varchar("insightType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

/**
 * Voice Recordings - audio transcriptions
 */
export const voiceRecordings = mysqlTable("voice_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  audioUrl: text("audioUrl").notNull(),
  audioKey: varchar("audioKey", { length: 500 }).notNull(),
  transcription: text("transcription"),
  recordingType: varchar("recordingType", { length: 50 }), // task, goal, time_audit
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertVoiceRecording = typeof voiceRecordings.$inferInsert;
