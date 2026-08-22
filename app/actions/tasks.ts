"use server";

import { isHabiticaConfigured } from "@/lib/env";
import { habiticaClient } from "@/lib/habitica";
import { parseBatchInput } from "@/lib/parser";
import {
  BatchActionResult,
  HabiticaTask,
  HabiticaUser,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Frictionless Batch Capture
 * Parses multiline raw text and dispatches concurrent task creation to Habitica.
 */
export async function submitBatchCaptureAction(
  rawText: string
): Promise<BatchActionResult> {
  const trimmed = rawText?.trim() || "";

  if (!trimmed) {
    return {
      success: false,
      totalParsed: 0,
      createdCount: 0,
      failedCount: 0,
      results: [],
      errors: ["Input cannot be empty. Please enter at least one task line."],
      summary: "Empty input submitted.",
      isDemo: !isHabiticaConfigured(),
    };
  }

  try {
    // 1. Parse raw text into structured task payloads
    const parsed = parseBatchInput(trimmed);

    if (parsed.payloads.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        createdCount: 0,
        failedCount: 0,
        results: [],
        errors: ["No valid tasks could be parsed from the provided input."],
        summary: "No actionable task lines found.",
        isDemo: !isHabiticaConfigured(),
      };
    }

    // 2. Dispatch batch creation to Habitica API
    const batchOutcome = await habiticaClient.createTasksBatch(parsed.payloads);

    // 3. Trigger Next.js cache revalidation for the dashboard
    revalidatePath("/");

    const isAllSuccess = batchOutcome.failedCount === 0;
    const isPartialSuccess =
      batchOutcome.createdCount > 0 && batchOutcome.failedCount > 0;

    const summaryParts: string[] = [];
    if (parsed.stats.todos > 0) summaryParts.push(`${parsed.stats.todos} to-do(s)`);
    if (parsed.stats.dailies > 0)
      summaryParts.push(`${parsed.stats.dailies} daily(s)`);
    if (parsed.stats.habits > 0)
      summaryParts.push(`${parsed.stats.habits} habit(s)`);

    const summaryText = `Created ${batchOutcome.createdCount} of ${
      parsed.payloads.length
    } tasks (${summaryParts.join(", ")})`;

    return {
      success: isAllSuccess || isPartialSuccess,
      totalParsed: parsed.payloads.length,
      createdCount: batchOutcome.createdCount,
      failedCount: batchOutcome.failedCount,
      results: batchOutcome.results,
      errors: batchOutcome.errors,
      summary: summaryText,
      isDemo: !isHabiticaConfigured(),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected batch processing failure";

    return {
      success: false,
      totalParsed: 0,
      createdCount: 0,
      failedCount: 1,
      results: [],
      errors: [message],
      summary: "Batch capture failed.",
      isDemo: !isHabiticaConfigured(),
    };
  }
}

/**
 * Server Action: Score or Complete Task
 */
export async function toggleTaskAction(
  taskId: string,
  direction: "up" | "down" = "up"
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await habiticaClient.scoreTask(taskId, direction);
    revalidatePath("/");
    return { success: res.success };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to score task";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetch complete dashboard data
 */
export async function fetchDashboardDataAction(): Promise<{
  user: HabiticaUser;
  tasks: HabiticaTask[];
  isConfigured: boolean;
}> {
  try {
    const isConfigured = isHabiticaConfigured();
    const [user, tasks] = await Promise.all([
      habiticaClient.getUserProfile(),
      habiticaClient.getUserTasks(),
    ]);

    return {
      user,
      tasks,
      isConfigured,
    };
  } catch (error: unknown) {
    console.error("Dashboard data fetch error:", error);
    // Return mock fallback on catastrophic error
    const [user, tasks] = await Promise.all([
      habiticaClient.getUserProfile(),
      habiticaClient.getUserTasks(),
    ]);
    return {
      user,
      tasks,
      isConfigured: false,
    };
  }
}
