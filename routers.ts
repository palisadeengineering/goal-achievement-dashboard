import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== TIME AUDIT ROUTER =====
  timeAudit: router({
    create: protectedProcedure
      .input(
        z.object({
          activityDate: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          description: z.string(),
          energyLevel: z.enum(["red", "yellow", "green"]),
          dollarValue: z.number().min(1).max(4),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createTimeAuditEntry({
          userId: ctx.user.id,
          activityDate: new Date(input.activityDate),
          startTime: input.startTime,
          endTime: input.endTime,
          description: input.description,
          energyLevel: input.energyLevel,
          dollarValue: input.dollarValue,
          category: input.category,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return db.getTimeAuditEntriesByUser(ctx.user.id, startDate, endDate);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          activityDate: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          description: z.string().optional(),
          energyLevel: z.enum(["red", "yellow", "green"]).optional(),
          dollarValue: z.number().min(1).max(4).optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, activityDate, ...otherUpdates } = input;
        const updates = {
          ...otherUpdates,
          activityDate: activityDate ? new Date(activityDate) : undefined,
        };
        await db.updateTimeAuditEntry(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTimeAuditEntry(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== POWER GOALS ROUTER =====
  goals: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          targetMonth: z.number().min(1).max(12).optional(),
          targetYear: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createPowerGoal({
          userId: ctx.user.id,
          ...input,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPowerGoalsByUser(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          targetMonth: z.number().min(1).max(12).optional(),
          targetYear: z.number().optional(),
          status: z.enum(["active", "completed", "archived"]).optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updatePowerGoal(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePowerGoal(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== PROJECTS ROUTER =====
  projects: router({
    create: protectedProcedure
      .input(
        z.object({
          goalId: z.number(),
          title: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createProject({
          userId: ctx.user.id,
          ...input,
        });
      }),

    listByGoal: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getProjectsByGoal(input.goalId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["not_started", "in_progress", "completed"]).optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateProject(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== NEXT ACTIONS ROUTER =====
  nextActions: router({
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          description: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createNextAction({
          userId: ctx.user.id,
          ...input,
        });
      }),

    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getNextActionsByProject(input.projectId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().optional(),
          completed: z.boolean().optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateNextAction(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteNextAction(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== POMODORO ROUTER =====
  pomodoro: router({
    start: protectedProcedure
      .input(
        z.object({
          taskDescription: z.string().optional(),
          duration: z.number().default(1500), // 25 minutes in seconds
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createPomodoroSession({
          userId: ctx.user.id,
          startedAt: new Date(),
          duration: input.duration,
          taskDescription: input.taskDescription,
        });
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePomodoroSession(input.id, ctx.user.id, {
          completed: true,
          completedAt: new Date(),
        });
        return { success: true };
      }),

    list: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getPomodoroSessionsByUser(ctx.user.id, input.startDate, input.endDate);
      }),

    todayCount: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await db.getPomodoroSessionsByUser(ctx.user.id, today, tomorrow);
      return {
        total: sessions.length,
        completed: sessions.filter(s => s.completed).length,
      };
    }),
  }),

  // ===== NORTH STAR METRICS ROUTER =====
  northStar: router({
    create: protectedProcedure
      .input(
        z.object({
          metricName: z.string(),
          unit: z.string(),
          targetValue: z.number(),
          currentValue: z.number(),
          recordedDate: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createNorthStarMetric({
          userId: ctx.user.id,
          metricName: input.metricName,
          unit: input.unit,
          targetValue: input.targetValue.toString(),
          currentValue: input.currentValue.toString(),
          recordedDate: new Date(input.recordedDate),
          notes: input.notes,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          metricName: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getNorthStarMetricsByUser(ctx.user.id, input.metricName);
      }),
  }),

  // ===== SCORECARD METRICS ROUTER =====
  scorecard: router({
    create: protectedProcedure
      .input(
        z.object({
          metricName: z.string(),
          category: z.string().optional(),
          unit: z.string().optional(),
          targetValue: z.number().optional(),
          currentValue: z.number(),
          recordedDate: z.string(),
          status: z.enum(["red", "yellow", "green"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createScorecardMetric({
          userId: ctx.user.id,
          metricName: input.metricName,
          category: input.category,
          unit: input.unit,
          targetValue: input.targetValue?.toString(),
          currentValue: input.currentValue.toString(),
          recordedDate: new Date(input.recordedDate),
          status: input.status,
          notes: input.notes,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return db.getScorecardMetricsByUser(ctx.user.id, startDate, endDate);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          metricName: z.string().optional(),
          category: z.string().optional(),
          unit: z.string().optional(),
          targetValue: z.number().optional(),
          currentValue: z.number().optional(),
          recordedDate: z.string().optional(),
          status: z.enum(["red", "yellow", "green"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updates: any = {};
        if (input.metricName !== undefined) updates.metricName = input.metricName;
        if (input.category !== undefined) updates.category = input.category;
        if (input.unit !== undefined) updates.unit = input.unit;
        if (input.targetValue !== undefined) updates.targetValue = input.targetValue.toString();
        if (input.currentValue !== undefined) updates.currentValue = input.currentValue.toString();
        if (input.recordedDate !== undefined) updates.recordedDate = new Date(input.recordedDate);
        if (input.status !== undefined) updates.status = input.status;
        if (input.notes !== undefined) updates.notes = input.notes;

        await db.updateScorecardMetric(input.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteScorecardMetric(input.id);
        return { success: true };
      }),
  }),

  // ===== ACCOUNTABILITY ROUTER =====
  accountability: router({
    createPartner: protectedProcedure
      .input(
        z.object({
          partnerName: z.string(),
          partnerEmail: z.string().optional(),
          partnerPhone: z.string().optional(),
          relationship: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createAccountabilityPartner({
          userId: ctx.user.id,
          ...input,
        });
      }),

    listPartners: protectedProcedure.query(async ({ ctx }) => {
      return db.getAccountabilityPartnersByUser(ctx.user.id);
    }),

    updatePartner: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          partnerName: z.string().optional(),
          partnerEmail: z.string().optional(),
          partnerPhone: z.string().optional(),
          relationship: z.string().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateAccountabilityPartner(id, ctx.user.id, updates);
        return { success: true };
      }),

    createCommitment: protectedProcedure
      .input(
        z.object({
          partnerId: z.number().optional(),
          goalId: z.number().optional(),
          title: z.string(),
          description: z.string().optional(),
          deadline: z.string().optional(),
          stakes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createCommitment({
          userId: ctx.user.id,
          partnerId: input.partnerId,
          goalId: input.goalId,
          title: input.title,
          description: input.description,
          deadline: input.deadline ? new Date(input.deadline) : undefined,
          stakes: input.stakes,
        });
      }),

    listCommitments: protectedProcedure.query(async ({ ctx }) => {
      return db.getCommitmentsByUser(ctx.user.id);
    }),

    updateCommitment: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          deadline: z.string().optional(),
          stakes: z.string().optional(),
          status: z.enum(["active", "completed", "failed"]).optional(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, deadline, ...otherUpdates } = input;
        const updates = {
          ...otherUpdates,
          deadline: deadline ? new Date(deadline) : undefined,
        };
        await db.updateCommitment(id, ctx.user.id, updates);
        return { success: true };
      }),

    createCheckIn: protectedProcedure
      .input(
        z.object({
          partnerId: z.number().optional(),
          commitmentId: z.number().optional(),
          scheduledDate: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createCheckIn({
          userId: ctx.user.id,
          partnerId: input.partnerId,
          commitmentId: input.commitmentId,
          scheduledDate: new Date(input.scheduledDate),
          notes: input.notes,
        });
      }),

    listCheckIns: protectedProcedure.query(async ({ ctx }) => {
      return db.getCheckInsByUser(ctx.user.id);
    }),

    completeCheckIn: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateCheckIn(input.id, ctx.user.id, {
          completed: true,
          completedAt: new Date(),
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  // ===== RELATIONSHIPS ROUTER =====
  relationships: router({
    create: protectedProcedure
      .input(
        z.object({
          contactName: z.string(),
          relationship: z.string().optional(),
          energyImpact: z.enum(["red", "yellow", "green"]),
          notes: z.string().optional(),
          lastInteraction: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createRelationship({
          userId: ctx.user.id,
          contactName: input.contactName,
          relationship: input.relationship,
          energyImpact: input.energyImpact,
          notes: input.notes,
          lastInteraction: input.lastInteraction ? new Date(input.lastInteraction) : undefined,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getRelationshipsByUser(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          contactName: z.string().optional(),
          relationship: z.string().optional(),
          energyImpact: z.enum(["red", "yellow", "green"]).optional(),
          notes: z.string().optional(),
          boundarySet: z.boolean().optional(),
          lastInteraction: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, lastInteraction, ...otherUpdates } = input;
        const updates = {
          ...otherUpdates,
          lastInteraction: lastInteraction ? new Date(lastInteraction) : undefined,
        };
        await db.updateRelationship(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteRelationship(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== DAILY PLANNING ROUTER =====
  dailyPlan: router({
    create: protectedProcedure
      .input(
        z.object({
          planDate: z.string(),
          first90MinTask: z.string().optional(),
          keyTasks: z.string().optional(), // JSON string
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createDailyPlan({
          userId: ctx.user.id,
          planDate: new Date(input.planDate),
          first90MinTask: input.first90MinTask,
          keyTasks: input.keyTasks,
          notes: input.notes,
        });
      }),

    getByDate: protectedProcedure
      .input(z.object({ planDate: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getDailyPlanByDate(ctx.user.id, new Date(input.planDate));
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          first90MinTask: z.string().optional(),
          keyTasks: z.string().optional(),
          notes: z.string().optional(),
          completed: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateDailyPlan(id, ctx.user.id, updates);
        return { success: true };
      }),
  }),

  // ===== AI INSIGHTS ROUTER =====
  insights: router({
    generate: protectedProcedure
      .input(
        z.object({
          type: z.enum(["time_audit", "goal_progress", "productivity_patterns"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get relevant data based on type
        let prompt = "";
        let title = "";

        if (input.type === "time_audit") {
          const entries = await db.getTimeAuditEntriesByUser(ctx.user.id);
          const redCount = entries.filter(e => e.energyLevel === "red").length;
          const yellowCount = entries.filter(e => e.energyLevel === "yellow").length;
          const greenCount = entries.filter(e => e.energyLevel === "green").length;

          prompt = `Analyze this time audit data and provide insights:
- Red (energy-draining) activities: ${redCount}
- Yellow (neutral) activities: ${yellowCount}
- Green (energizing) activities: ${greenCount}

Recent entries:
${entries.slice(0, 10).map(e => `- ${e.description} (${e.energyLevel}, ${"$".repeat(e.dollarValue)})`).join("\n")}

Provide 3-5 actionable recommendations to maximize green time and minimize red time.`;
          title = "Time & Energy Audit Insights";
        } else if (input.type === "goal_progress") {
          const goals = await db.getPowerGoalsByUser(ctx.user.id);
          prompt = `Analyze these goals and provide progress insights:
${goals.map(g => `- ${g.title} (${g.status})`).join("\n")}

Provide recommendations for staying on track and achieving these goals.`;
          title = "Goal Progress Analysis";
        } else {
          const pomodoros = await db.getPomodoroSessionsByUser(ctx.user.id);
          const completedCount = pomodoros.filter(p => p.completed).length;
          prompt = `Analyze productivity patterns:
- Total Pomodoro sessions: ${pomodoros.length}
- Completed sessions: ${completedCount}
- Completion rate: ${pomodoros.length > 0 ? Math.round((completedCount / pomodoros.length) * 100) : 0}%

Provide insights on productivity trends and recommendations for improvement.`;
          title = "Productivity Pattern Analysis";
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a productivity coach analyzing user data. Provide clear, actionable insights.",
            },
            { role: "user", content: prompt },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === 'string' ? messageContent : "Unable to generate insights at this time.";

        return db.createAIInsight({
          userId: ctx.user.id,
          insightType: input.type,
          title,
          content,
          category: input.type,
        });
      }),

    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
        return db.getAIInsightsByUser(ctx.user.id, input.unreadOnly);
      }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markInsightAsRead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== VOICE CAPTURE ROUTER =====
  voice: router({
    upload: protectedProcedure
      .input(
        z.object({
          audioData: z.string(), // base64 encoded audio
          recordingType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.audioData, "base64");
        const fileKey = `${ctx.user.id}/voice/${nanoid()}.webm`;

        const { url } = await storagePut(fileKey, buffer, "audio/webm");

        // Create voice recording entry
        const recording = await db.createVoiceRecording({
          userId: ctx.user.id,
          audioUrl: url,
          audioKey: fileKey,
          recordingType: input.recordingType,
        });

        // Transcribe audio
        try {
          const transcription = await transcribeAudio({
            audioUrl: url,
          });

          if ('text' in transcription) {
            // Update with transcription
            await db.updateVoiceRecording(recording.id, ctx.user.id, {
              transcription: transcription.text,
              processed: true,
            });

            return {
              ...recording,
              transcription: transcription.text,
              processed: true,
            };
          }
        } catch (error) {
          console.error("Transcription error:", error);
        }
        return recording;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getVoiceRecordingsByUser(ctx.user.id);
    }),
  }),

  // ===== GOAL REVIEWS ROUTER =====
  goalReviews: router({
    create: protectedProcedure
      .input(
        z.object({
          reviewDate: z.string(),
          reviewTime: z.enum(["morning", "afternoon", "evening"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createGoalReview({
          userId: ctx.user.id,
          reviewDate: new Date(input.reviewDate),
          reviewTime: input.reviewTime,
        });
      }),

    listByDate: protectedProcedure
      .input(z.object({ reviewDate: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getGoalReviewsByDate(ctx.user.id, new Date(input.reviewDate));
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateGoalReview(input.id, ctx.user.id, {
          completed: true,
          completedAt: new Date(),
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
