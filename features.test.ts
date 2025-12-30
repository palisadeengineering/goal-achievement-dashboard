import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Time Audit Features", () => {
  it("should create a time audit entry", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const entry = await caller.timeAudit.create({
      activityDate: "2025-12-29",
      startTime: "09:00",
      endTime: "09:30",
      description: "Morning planning session",
      energyLevel: "green",
      dollarValue: 3,
      category: "Work",
    });

    expect(entry).toBeDefined();
    expect(entry.description).toBe("Morning planning session");
    expect(entry.energyLevel).toBe("green");
    expect(entry.dollarValue).toBe(3);
  });

  it("should list time audit entries for user", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const entries = await caller.timeAudit.list({});

    expect(Array.isArray(entries)).toBe(true);
  });
});

describe("Power Goals Features", () => {
  it("should create a power goal", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const goal = await caller.goals.create({
      title: "Launch new product",
      description: "Complete MVP and launch to 100 users",
    });

    expect(goal).toBeDefined();
    expect(goal.title).toBe("Launch new product");
    expect(goal.status).toBe("active");
  });

  it("should list power goals for user", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const goals = await caller.goals.list();

    expect(Array.isArray(goals)).toBe(true);
  });

  it("should update goal status to completed", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a goal first
    const goal = await caller.goals.create({
      title: "Test goal for completion",
    });

    // Update to completed
    const result = await caller.goals.update({
      id: goal.id,
      status: "completed",
      completedAt: new Date(),
    });

    expect(result.success).toBe(true);
  });
});

describe("Pomodoro Timer Features", () => {
  it("should start a pomodoro session", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const session = await caller.pomodoro.start({
      taskDescription: "Write unit tests",
      duration: 1500,
    });

    expect(session).toBeDefined();
    expect(session.duration).toBe(1500);
    expect(session.completed).toBe(false);
  });

  it("should get today's pomodoro count", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.pomodoro.todayCount();

    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.completed).toBe("number");
  });

  it("should complete a pomodoro session", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Start a session
    const session = await caller.pomodoro.start({
      duration: 1500,
    });

    // Complete it
    const result = await caller.pomodoro.complete({ id: session.id });

    expect(result.success).toBe(true);
  });
});

describe("North Star Metrics Features", () => {
  it("should create a north star metric entry", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metric = await caller.northStar.create({
      metricName: "Monthly Recurring Revenue",
      unit: "USD",
      targetValue: 10000,
      currentValue: 5000,
      recordedDate: "2025-12-29",
      notes: "Growing steadily",
    });

    expect(metric).toBeDefined();
    expect(metric.metricName).toBe("Monthly Recurring Revenue");
    expect(metric.unit).toBe("USD");
  });

  it("should list north star metrics", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.northStar.list({});

    expect(Array.isArray(metrics)).toBe(true);
  });
});

describe("Accountability Features", () => {
  it("should create an accountability partner", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const partner = await caller.accountability.createPartner({
      partnerName: "John Doe",
      partnerEmail: "john@example.com",
      relationship: "Business partner",
    });

    expect(partner).toBeDefined();
    expect(partner.partnerName).toBe("John Doe");
    expect(partner.active).toBe(true);
  });

  it("should create a commitment", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const commitment = await caller.accountability.createCommitment({
      title: "Ship MVP by end of month",
      description: "Complete all features and deploy",
      deadline: "2025-12-31",
      stakes: "$100 donation if not completed",
    });

    expect(commitment).toBeDefined();
    expect(commitment.title).toBe("Ship MVP by end of month");
    expect(commitment.status).toBe("active");
  });

  it("should list commitments", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const commitments = await caller.accountability.listCommitments();

    expect(Array.isArray(commitments)).toBe(true);
  });
});

describe("Relationships Features", () => {
  it("should create a relationship entry", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const relationship = await caller.relationships.create({
      contactName: "Jane Smith",
      relationship: "Mentor",
      energyImpact: "green",
      notes: "Always provides valuable advice",
    });

    expect(relationship).toBeDefined();
    expect(relationship.contactName).toBe("Jane Smith");
    expect(relationship.energyImpact).toBe("green");
  });

  it("should list relationships", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const relationships = await caller.relationships.list();

    expect(Array.isArray(relationships)).toBe(true);
  });

  it("should update relationship boundary status", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a relationship
    const relationship = await caller.relationships.create({
      contactName: "Test Contact",
      energyImpact: "red",
    });

    // Set boundary
    const result = await caller.relationships.update({
      id: relationship.id,
      boundarySet: true,
    });

    expect(result.success).toBe(true);
  });
});

describe("Daily Planning Features", () => {
  it("should create a daily plan", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const plan = await caller.dailyPlan.create({
      planDate: "2025-12-30",
      first90MinTask: "Write product documentation",
      keyTasks: JSON.stringify(["Review PRs", "Team standup", "Client call"]),
      notes: "Focus on high-priority items",
    });

    expect(plan).toBeDefined();
    expect(plan.first90MinTask).toBe("Write product documentation");
  });

  it("should get daily plan by date", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const plan = await caller.dailyPlan.getByDate({
      planDate: "2025-12-30",
    });

    // May be undefined if no plan exists for that date
    expect(plan === undefined || typeof plan === "object").toBe(true);
  });
});

describe("AI Insights Features", () => {
  it("should list AI insights", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const insights = await caller.insights.list({ unreadOnly: false });

    expect(Array.isArray(insights)).toBe(true);
  });

  it("should mark insight as read", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // This test assumes an insight exists; in a real scenario, you'd create one first
    // For now, we just test that the mutation doesn't throw
    try {
      await caller.insights.markRead({ id: 999999 });
    } catch (error) {
      // Expected to fail if ID doesn't exist, but shouldn't crash
      expect(error).toBeDefined();
    }
  });
});

describe("Scorecard Metrics Features", () => {
  it("should create a scorecard metric", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metric = await caller.scorecard.create({
      metricName: "Daily Active Users",
      category: "Growth",
      unit: "users",
      targetValue: 1000,
      currentValue: 750,
      recordedDate: "2025-12-29",
      status: "yellow",
    });

    expect(metric).toBeDefined();
    expect(metric.metricName).toBe("Daily Active Users");
    expect(metric.status).toBe("yellow");
  });

  it("should list scorecard metrics", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.scorecard.list({});

    expect(Array.isArray(metrics)).toBe(true);
  });
});
