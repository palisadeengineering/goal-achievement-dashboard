import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  timeAuditEntries,
  InsertTimeAuditEntry,
  TimeAuditEntry,
  powerGoals,
  InsertPowerGoal,
  PowerGoal,
  projects,
  InsertProject,
  Project,
  nextActions,
  InsertNextAction,
  NextAction,
  pomodoroSessions,
  InsertPomodoroSession,
  PomodoroSession,
  northStarMetrics,
  InsertNorthStarMetric,
  NorthStarMetric,
  scorecardMetrics,
  InsertScorecardMetric,
  ScorecardMetric,
  accountabilityPartners,
  InsertAccountabilityPartner,
  AccountabilityPartner,
  commitments,
  InsertCommitment,
  Commitment,
  checkIns,
  InsertCheckIn,
  CheckIn,
  relationships,
  InsertRelationship,
  Relationship,
  dailyPlans,
  InsertDailyPlan,
  DailyPlan,
  goalReviews,
  InsertGoalReview,
  GoalReview,
  aiInsights,
  InsertAIInsight,
  AIInsight,
  voiceRecordings,
  InsertVoiceRecording,
  VoiceRecording,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER HELPERS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== TIME AUDIT HELPERS =====

export async function createTimeAuditEntry(entry: InsertTimeAuditEntry): Promise<TimeAuditEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timeAuditEntries).values(entry);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(timeAuditEntries)
    .where(eq(timeAuditEntries.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getTimeAuditEntriesByUser(userId: number, startDate?: Date, endDate?: Date): Promise<TimeAuditEntry[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(timeAuditEntries).where(eq(timeAuditEntries.userId, userId));

  if (startDate && endDate) {
    const conditions = and(
      eq(timeAuditEntries.userId, userId),
      gte(timeAuditEntries.activityDate, startDate),
      lte(timeAuditEntries.activityDate, endDate)
    );
    return db.select().from(timeAuditEntries).where(conditions).orderBy(desc(timeAuditEntries.activityDate));
  }

  return query.orderBy(desc(timeAuditEntries.activityDate));
}

export async function updateTimeAuditEntry(id: number, userId: number, updates: Partial<InsertTimeAuditEntry>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(timeAuditEntries).set(updates).where(and(eq(timeAuditEntries.id, id), eq(timeAuditEntries.userId, userId)));
}

export async function deleteTimeAuditEntry(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(timeAuditEntries).where(and(eq(timeAuditEntries.id, id), eq(timeAuditEntries.userId, userId)));
}

// ===== POWER GOALS HELPERS =====

export async function createPowerGoal(goal: InsertPowerGoal): Promise<PowerGoal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(powerGoals).values(goal);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(powerGoals)
    .where(eq(powerGoals.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getPowerGoalsByUser(userId: number): Promise<PowerGoal[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(powerGoals).where(eq(powerGoals.userId, userId)).orderBy(asc(powerGoals.targetMonth));
}

export async function updatePowerGoal(id: number, userId: number, updates: Partial<InsertPowerGoal>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(powerGoals).set(updates).where(and(eq(powerGoals.id, id), eq(powerGoals.userId, userId)));
}

export async function deletePowerGoal(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(powerGoals).where(and(eq(powerGoals.id, id), eq(powerGoals.userId, userId)));
}

// ===== PROJECT HELPERS =====

export async function createProject(project: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(project);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(projects)
    .where(eq(projects.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getProjectsByGoal(goalId: number, userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(and(eq(projects.goalId, goalId), eq(projects.userId, userId)));
}

export async function updateProject(id: number, userId: number, updates: Partial<InsertProject>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(updates).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ===== NEXT ACTION HELPERS =====

export async function createNextAction(action: InsertNextAction): Promise<NextAction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(nextActions).values(action);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(nextActions)
    .where(eq(nextActions.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getNextActionsByProject(projectId: number, userId: number): Promise<NextAction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(nextActions).where(and(eq(nextActions.projectId, projectId), eq(nextActions.userId, userId)));
}

export async function updateNextAction(id: number, userId: number, updates: Partial<InsertNextAction>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(nextActions).set(updates).where(and(eq(nextActions.id, id), eq(nextActions.userId, userId)));
}

export async function deleteNextAction(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(nextActions).where(and(eq(nextActions.id, id), eq(nextActions.userId, userId)));
}

// ===== POMODORO HELPERS =====

export async function createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pomodoroSessions).values(session);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(pomodoroSessions)
    .where(eq(pomodoroSessions.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getPomodoroSessionsByUser(userId: number, startDate?: Date, endDate?: Date): Promise<PomodoroSession[]> {
  const db = await getDb();
  if (!db) return [];

  if (startDate && endDate) {
    return db
      .select()
      .from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.userId, userId), gte(pomodoroSessions.startedAt, startDate), lte(pomodoroSessions.startedAt, endDate)))
      .orderBy(desc(pomodoroSessions.startedAt));
  }

  return db.select().from(pomodoroSessions).where(eq(pomodoroSessions.userId, userId)).orderBy(desc(pomodoroSessions.startedAt));
}

export async function updatePomodoroSession(id: number, userId: number, updates: Partial<InsertPomodoroSession>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pomodoroSessions).set(updates).where(and(eq(pomodoroSessions.id, id), eq(pomodoroSessions.userId, userId)));
}

// ===== NORTH STAR METRIC HELPERS =====

export async function createNorthStarMetric(metric: InsertNorthStarMetric): Promise<NorthStarMetric> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(northStarMetrics).values(metric);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(northStarMetrics)
    .where(eq(northStarMetrics.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getNorthStarMetricsByUser(userId: number, metricName?: string): Promise<NorthStarMetric[]> {
  const db = await getDb();
  if (!db) return [];

  if (metricName) {
    return db
      .select()
      .from(northStarMetrics)
      .where(and(eq(northStarMetrics.userId, userId), eq(northStarMetrics.metricName, metricName)))
      .orderBy(desc(northStarMetrics.recordedDate));
  }

  return db.select().from(northStarMetrics).where(eq(northStarMetrics.userId, userId)).orderBy(desc(northStarMetrics.recordedDate));
}

// ===== SCORECARD METRIC HELPERS =====

export async function createScorecardMetric(metric: InsertScorecardMetric): Promise<ScorecardMetric> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scorecardMetrics).values(metric);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(scorecardMetrics)
    .where(eq(scorecardMetrics.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getScorecardMetricsByUser(userId: number, startDate?: Date, endDate?: Date): Promise<ScorecardMetric[]> {
  const db = await getDb();
  if (!db) return [];

  if (startDate && endDate) {
    return db
      .select()
      .from(scorecardMetrics)
      .where(and(eq(scorecardMetrics.userId, userId), gte(scorecardMetrics.recordedDate, startDate), lte(scorecardMetrics.recordedDate, endDate)))
      .orderBy(desc(scorecardMetrics.recordedDate));
  }

  return db.select().from(scorecardMetrics).where(eq(scorecardMetrics.userId, userId)).orderBy(desc(scorecardMetrics.recordedDate));
}

export async function updateScorecardMetric(id: number, updates: Partial<InsertScorecardMetric>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(scorecardMetrics).set(updates).where(eq(scorecardMetrics.id, id));
}

export async function deleteScorecardMetric(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scorecardMetrics).where(eq(scorecardMetrics.id, id));
}

// ===== ACCOUNTABILITY PARTNER HELPERS =====

export async function createAccountabilityPartner(partner: InsertAccountabilityPartner): Promise<AccountabilityPartner> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(accountabilityPartners).values(partner);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(accountabilityPartners)
    .where(eq(accountabilityPartners.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getAccountabilityPartnersByUser(userId: number): Promise<AccountabilityPartner[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(accountabilityPartners).where(eq(accountabilityPartners.userId, userId));
}

export async function updateAccountabilityPartner(id: number, userId: number, updates: Partial<InsertAccountabilityPartner>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(accountabilityPartners).set(updates).where(and(eq(accountabilityPartners.id, id), eq(accountabilityPartners.userId, userId)));
}

// ===== COMMITMENT HELPERS =====

export async function createCommitment(commitment: InsertCommitment): Promise<Commitment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(commitments).values(commitment);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(commitments)
    .where(eq(commitments.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getCommitmentsByUser(userId: number): Promise<Commitment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(commitments).where(eq(commitments.userId, userId)).orderBy(desc(commitments.createdAt));
}

export async function updateCommitment(id: number, userId: number, updates: Partial<InsertCommitment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(commitments).set(updates).where(and(eq(commitments.id, id), eq(commitments.userId, userId)));
}

// ===== CHECK-IN HELPERS =====

export async function createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(checkIns).values(checkIn);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getCheckInsByUser(userId: number): Promise<CheckIn[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(checkIns).where(eq(checkIns.userId, userId)).orderBy(asc(checkIns.scheduledDate));
}

export async function updateCheckIn(id: number, userId: number, updates: Partial<InsertCheckIn>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(checkIns).set(updates).where(and(eq(checkIns.id, id), eq(checkIns.userId, userId)));
}

// ===== RELATIONSHIP HELPERS =====

export async function createRelationship(relationship: InsertRelationship): Promise<Relationship> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(relationships).values(relationship);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(relationships)
    .where(eq(relationships.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getRelationshipsByUser(userId: number): Promise<Relationship[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(relationships).where(eq(relationships.userId, userId));
}

export async function updateRelationship(id: number, userId: number, updates: Partial<InsertRelationship>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(relationships).set(updates).where(and(eq(relationships.id, id), eq(relationships.userId, userId)));
}

export async function deleteRelationship(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(relationships).where(and(eq(relationships.id, id), eq(relationships.userId, userId)));
}

// ===== DAILY PLAN HELPERS =====

export async function createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dailyPlans).values(plan);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(dailyPlans)
    .where(eq(dailyPlans.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getDailyPlanByDate(userId: number, planDate: Date): Promise<DailyPlan | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(dailyPlans)
    .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.planDate, planDate)))
    .limit(1);

  return result[0];
}

export async function updateDailyPlan(id: number, userId: number, updates: Partial<InsertDailyPlan>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dailyPlans).set(updates).where(and(eq(dailyPlans.id, id), eq(dailyPlans.userId, userId)));
}

// ===== GOAL REVIEW HELPERS =====

export async function createGoalReview(review: InsertGoalReview): Promise<GoalReview> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(goalReviews).values(review);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(goalReviews)
    .where(eq(goalReviews.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getGoalReviewsByDate(userId: number, reviewDate: Date): Promise<GoalReview[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(goalReviews).where(and(eq(goalReviews.userId, userId), eq(goalReviews.reviewDate, reviewDate)));
}

export async function updateGoalReview(id: number, userId: number, updates: Partial<InsertGoalReview>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(goalReviews).set(updates).where(and(eq(goalReviews.id, id), eq(goalReviews.userId, userId)));
}

// ===== AI INSIGHT HELPERS =====

export async function createAIInsight(insight: InsertAIInsight): Promise<AIInsight> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aiInsights).values(insight);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getAIInsightsByUser(userId: number, unreadOnly: boolean = false): Promise<AIInsight[]> {
  const db = await getDb();
  if (!db) return [];

  if (unreadOnly) {
    return db
      .select()
      .from(aiInsights)
      .where(and(eq(aiInsights.userId, userId), eq(aiInsights.read, false)))
      .orderBy(desc(aiInsights.createdAt));
  }

  return db.select().from(aiInsights).where(eq(aiInsights.userId, userId)).orderBy(desc(aiInsights.createdAt));
}

export async function markInsightAsRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(aiInsights).set({ read: true }).where(and(eq(aiInsights.id, id), eq(aiInsights.userId, userId)));
}

// ===== VOICE RECORDING HELPERS =====

export async function createVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(voiceRecordings).values(recording);
  const insertedId = Number((result as any)[0]?.insertId || (result as any).insertId);
  const inserted = await db
    .select()
    .from(voiceRecordings)
    .where(eq(voiceRecordings.id, insertedId))
    .limit(1);

  return inserted[0]!;
}

export async function getVoiceRecordingsByUser(userId: number): Promise<VoiceRecording[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(voiceRecordings).where(eq(voiceRecordings.userId, userId)).orderBy(desc(voiceRecordings.createdAt));
}

export async function updateVoiceRecording(id: number, userId: number, updates: Partial<InsertVoiceRecording>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(voiceRecordings).set(updates).where(and(eq(voiceRecordings.id, id), eq(voiceRecordings.userId, userId)));
}
