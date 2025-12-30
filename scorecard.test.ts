import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Scorecard Feature", () => {
  it("creates a new scorecard metric", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scorecard.create({
      metricName: "Daily Active Users",
      category: "Growth",
      unit: "users",
      targetValue: 1000,
      currentValue: 750,
      recordedDate: "2025-12-29",
      status: "yellow",
      notes: "Making progress",
    });

    expect(result).toBeDefined();
    expect(result.metricName).toBe("Daily Active Users");
    expect(result.category).toBe("Growth");
    expect(result.unit).toBe("users");
    expect(result.status).toBe("yellow");
  });

  it("lists scorecard metrics for a user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a metric first
    await caller.scorecard.create({
      metricName: "Revenue",
      unit: "$",
      targetValue: 50000,
      currentValue: 45000,
      recordedDate: "2025-12-29",
      status: "green",
    });

    const metrics = await caller.scorecard.list({
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });

    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0]).toHaveProperty("metricName");
    expect(metrics[0]).toHaveProperty("currentValue");
    expect(metrics[0]).toHaveProperty("targetValue");
  });

  it("updates an existing scorecard metric", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a metric
    const created = await caller.scorecard.create({
      metricName: "Customer Satisfaction",
      unit: "%",
      targetValue: 95,
      currentValue: 88,
      recordedDate: "2025-12-29",
      status: "yellow",
    });

    // Update the metric
    const updateResult = await caller.scorecard.update({
      id: created.id,
      currentValue: 92,
      status: "green",
    });

    expect(updateResult.success).toBe(true);

    // Verify the update
    const metrics = await caller.scorecard.list({});
    const updated = metrics.find((m) => m.id === created.id);
    expect(updated?.currentValue).toBe("92.00");
    expect(updated?.status).toBe("green");
  });

  it("deletes a scorecard metric", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a metric
    const created = await caller.scorecard.create({
      metricName: "Test Metric to Delete",
      unit: "count",
      targetValue: 100,
      currentValue: 50,
      recordedDate: "2025-12-29",
      status: "red",
    });

    // Delete the metric
    const deleteResult = await caller.scorecard.delete({ id: created.id });
    expect(deleteResult.success).toBe(true);

    // Verify deletion
    const metrics = await caller.scorecard.list({});
    const deleted = metrics.find((m) => m.id === created.id);
    expect(deleted).toBeUndefined();
  });

  it("filters metrics by date range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create metrics with different dates
    await caller.scorecard.create({
      metricName: "Old Metric",
      unit: "count",
      targetValue: 100,
      currentValue: 80,
      recordedDate: "2025-11-15",
      status: "green",
    });

    await caller.scorecard.create({
      metricName: "Recent Metric",
      unit: "count",
      targetValue: 100,
      currentValue: 90,
      recordedDate: "2025-12-28",
      status: "green",
    });

    // Query with date filter
    const recentMetrics = await caller.scorecard.list({
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });

    expect(recentMetrics.length).toBeGreaterThan(0);
    // All returned metrics should be within the date range
    recentMetrics.forEach((metric) => {
      const metricDate = new Date(metric.recordedDate);
      expect(metricDate.getTime()).toBeGreaterThanOrEqual(new Date("2025-12-01").getTime());
      expect(metricDate.getTime()).toBeLessThanOrEqual(new Date("2025-12-31").getTime());
    });
  });

  it("handles metrics with optional fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create metric without optional fields
    const result = await caller.scorecard.create({
      metricName: "Minimal Metric",
      unit: "count",
      currentValue: 42,
      recordedDate: "2025-12-29",
    });

    expect(result).toBeDefined();
    expect(result.metricName).toBe("Minimal Metric");
    expect(result.currentValue).toBe("42.00");
    expect(result.category).toBeNull();
    expect(result.targetValue).toBeNull();
  });

  it("tracks multiple metrics with the same name over time", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create multiple entries for the same metric
    await caller.scorecard.create({
      metricName: "Weekly Sales",
      unit: "$",
      targetValue: 10000,
      currentValue: 8000,
      recordedDate: "2025-12-22",
      status: "yellow",
    });

    await caller.scorecard.create({
      metricName: "Weekly Sales",
      unit: "$",
      targetValue: 10000,
      currentValue: 9500,
      recordedDate: "2025-12-29",
      status: "green",
    });

    const metrics = await caller.scorecard.list({
      startDate: "2025-12-01",
      endDate: "2025-12-31",
    });

    const weeklySales = metrics.filter((m) => m.metricName === "Weekly Sales");
    expect(weeklySales.length).toBeGreaterThanOrEqual(2);
    
    // Verify they're ordered by date (most recent first)
    if (weeklySales.length >= 2) {
      const firstDate = new Date(weeklySales[0].recordedDate);
      const secondDate = new Date(weeklySales[1].recordedDate);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }
  });
});
