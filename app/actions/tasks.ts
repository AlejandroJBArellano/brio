"use server";

import { isHabiticaConfigured } from "@/lib/env";
import { habiticaClient, MOCK_TASKS, MOCK_USER } from "@/lib/habitica";
import { parseBatchInput, parseTaskLine, toHabiticaPayload } from "@/lib/parser";
import {
  BatchActionResult,
  HabiticaTag,
  HabiticaTask,
  HabiticaTaskPayload,
  HabiticaUser,
  TaskType,
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
 * Server Action: Rapid Single Task Capture (used by Omnibar)
 */
export async function createSingleTaskAction(
  rawInput: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const parsed = parseTaskLine(rawInput);
    if (!parsed) {
      return { success: false, error: "Invalid task text" };
    }

    const payload = toHabiticaPayload(parsed);
    const task = await habiticaClient.createTask(payload);
    revalidatePath("/");
    return { success: true, task };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    return { success: false, error: message };
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
 * Server Action: Update Task in Place
 */
export async function updateTaskAction(
  taskId: string,
  payload: Partial<HabiticaTaskPayload>
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const task = await habiticaClient.updateTask(taskId, payload);
    revalidatePath("/");
    return { success: true, task };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update task";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Delete Task
 */
export async function deleteTaskAction(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await habiticaClient.deleteTask(taskId);
    revalidatePath("/");
    return { success: res.success };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete task";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Toggle Rest at Inn (Sleep)
 */
export async function toggleSleepAction(): Promise<{
  success: boolean;
  resting?: boolean;
  error?: string;
}> {
  try {
    const res = await habiticaClient.toggleSleep();
    revalidatePath("/");
    return { success: res.success, resting: res.resting };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to toggle inn sleep";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Add Checklist Subtask Item
 */
export async function addChecklistItemAction(
  taskId: string,
  text: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const task = await habiticaClient.createChecklistItem(taskId, text);
    revalidatePath("/");
    return { success: true, task };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to add checklist item";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Toggle Checklist Item Score
 */
export async function toggleChecklistItemAction(
  taskId: string,
  itemId: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const task = await habiticaClient.scoreChecklistItem(taskId, itemId);
    revalidatePath("/");
    return { success: true, task };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to toggle checklist item";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Delete Checklist Item
 */
export async function deleteChecklistItemAction(
  taskId: string,
  itemId: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const task = await habiticaClient.deleteChecklistItem(taskId, itemId);
    revalidatePath("/");
    return { success: true, task };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to remove checklist item";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetch Tags
 */
export async function fetchTagsAction(): Promise<HabiticaTag[]> {
  try {
    return await habiticaClient.getUserTags();
  } catch {
    return [];
  }
}

/**
 * Server Action: Fetch complete dashboard data
 */
export async function fetchDashboardDataAction(): Promise<{
  user: HabiticaUser;
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  isConfigured: boolean;
}> {
  try {
    const isConfigured = isHabiticaConfigured();
    const [user, tasks, tags] = await Promise.all([
      habiticaClient.getUserProfile(),
      habiticaClient.getUserTasks(),
      habiticaClient.getUserTags(),
    ]);

    return {
      user,
      tasks,
      tags,
      isConfigured,
    };
  } catch (error: unknown) {
    console.error("[Dashboard Habitica Fetch Warning]:", error);
    return {
      user: MOCK_USER,
      tasks: MOCK_TASKS,
      tags: [],
      isConfigured: false,
    };
  }
}
