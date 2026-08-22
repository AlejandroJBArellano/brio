import {
  BatchParseResult,
  HabiticaTaskPayload,
  ParsedFinancialInput,
  ParsedTask,
  TaskType,
  TransactionType,
} from "./types";

/**
 * Priority mapping for optional priority tags (e.g. !hard, !3, etc.)
 */
const PRIORITY_MAP: Record<string, number> = {
  "!trivial": 0.1,
  "!0.1": 0.1,
  "!1": 0.1, // Trivial
  "!easy": 1,
  "!2": 1, // Easy
  "!medium": 1.5,
  "!med": 1.5,
  "!3": 1.5, // Medium
  "!hard": 2,
  "!urgent": 2,
  "!4": 2, // Hard
};

/**
 * Detects and parses financial syntax for Brio Finanzas:
 * e.g. `-$85 Café con leche #antojo @nu // Starbucks`
 * e.g. `+$25000 Sueldo quincenal #ingreso @bbva`
 * e.g. `$120 Almuerzo #comida` (defaults to expense)
 */
export function parseFinancialInput(rawLine: string): ParsedFinancialInput {
  const trimmed = rawLine.trim();
  if (!trimmed) return { isFinancial: false };

  // Match financial prefixes: `-$`, `+$`, `$`, or `-[0-9]`, `+[0-9]`
  const financialMatch = trimmed.match(/^([-+]?\$?|\$[+-]?)\s*(\d+(?:\.\d{1,2})?)(.*)$/);
  if (!financialMatch) {
    return { isFinancial: false };
  }

  const prefix = financialMatch[1].trim();
  const rawAmount = parseFloat(financialMatch[2]);
  let remaining = financialMatch[3].trim();

  let type: TransactionType = "expense";
  if (prefix.includes("+")) {
    type = "income";
  } else if (prefix.includes("-")) {
    type = "expense";
  }

  let notes: string | undefined = undefined;
  if (remaining.includes("//")) {
    const [conceptPart, ...notesParts] = remaining.split("//");
    remaining = conceptPart.trim();
    notes = notesParts.join("//").trim();
  }

  // Extract account/card (e.g. @nu, @bbva, @efectivo)
  let account = "default";
  const accountMatch = remaining.match(/@([\w-]+)/);
  if (accountMatch) {
    account = accountMatch[1].toLowerCase();
    remaining = remaining.replace(/@[\w-]+/, "").trim();
  }

  // Extract category (e.g. #antojo, #comida, #transporte)
  let category = "general";
  let isAntExpense = false;
  const categoryMatch = remaining.match(/#([\w-]+)/);
  if (categoryMatch) {
    category = categoryMatch[1].toLowerCase();
    remaining = remaining.replace(/#[\w-]+/, "").trim();
    if (
      category === "antojo" ||
      category === "gustito" ||
      category === "snack" ||
      category === "hormiga"
    ) {
      isAntExpense = true;
    }
  }

  const concept = remaining.replace(/\s+/g, " ").trim() || (type === "income" ? "Ingreso" : "Gasto");

  return {
    isFinancial: true,
    type,
    amount: rawAmount,
    concept,
    category,
    account,
    isAntExpense,
    notes,
  };
}

/**
 * Parses an individual single line of text into a structured ParsedTask.
 */
export function parseTaskLine(rawLine: string): ParsedTask | null {
  const trimmed = rawLine.trim();
  if (!trimmed) return null;

  let line = trimmed;
  let taskType: TaskType = "todo";
  let up: boolean | undefined = undefined;
  let down: boolean | undefined = undefined;
  let priority: number | undefined = undefined;
  let notes: string | undefined = undefined;
  const tags: string[] = [];

  // 1. Check for notes split by `//` or ` | `
  if (line.includes("//")) {
    const [titlePart, ...notesParts] = line.split("//");
    line = titlePart.trim();
    notes = notesParts.join("//").trim();
  }

  // 2. Identify task type by prefix
  if (line.startsWith("* ") || line.startsWith("*")) {
    taskType = "daily";
    line = line.replace(/^\*\s*/, "");
  } else if (line.startsWith("+- ") || line.startsWith("+/- ")) {
    taskType = "habit";
    up = true;
    down = true;
    line = line.replace(/^(\+-|\+\/-)\s*/, "");
  } else if (line.startsWith("+ ") || line.startsWith("+")) {
    taskType = "habit";
    up = true;
    down = false;
    line = line.replace(/^\+\s*/, "");
  } else if (line.startsWith("- ") || (line.startsWith("-") && !line.startsWith("--"))) {
    taskType = "habit";
    up = false;
    down = true;
    line = line.replace(/^-\s*/, "");
  } else if (line.toLowerCase().startsWith("[d] ") || line.toLowerCase().startsWith("daily: ")) {
    taskType = "daily";
    line = line.replace(/^(\[d\]|daily:)\s*/i, "");
  } else if (line.toLowerCase().startsWith("[h] ") || line.toLowerCase().startsWith("habit: ")) {
    taskType = "habit";
    up = true;
    down = true;
    line = line.replace(/^(\[h\]|habit:)\s*/i, "");
  } else if (line.toLowerCase().startsWith("[t] ") || line.toLowerCase().startsWith("todo: ")) {
    taskType = "todo";
    line = line.replace(/^(\[t\]|todo:)\s*/i, "");
  }

  // 3. Extract priority flags (e.g. !urgent, !hard, !1, !2, !3, !4)
  const priorityRegex = /!(trivial|easy|medium|med|hard|urgent|0\.1|[1-4])\b/gi;
  const priorityMatches = line.match(priorityRegex);
  if (priorityMatches && priorityMatches.length > 0) {
    const key = priorityMatches[0].toLowerCase();
    if (PRIORITY_MAP[key] !== undefined) {
      priority = PRIORITY_MAP[key];
    }
    line = line.replace(priorityRegex, "").trim();
  }

  // 4. Extract tags (e.g., #work #health #deep-work)
  const hashtagRegex = /#([\w-]+)/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = hashtagRegex.exec(line)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    if (!tags.includes(tagName)) {
      tags.push(tagName);
    }
  }
  // Clean tags from main text title
  line = line.replace(hashtagRegex, "").trim();

  // Clean excess whitespace
  const cleanText = line.replace(/\s+/g, " ").trim();
  if (!cleanText) return null;

  return {
    raw: trimmed,
    text: cleanText,
    type: taskType,
    notes,
    tags,
    priority,
    up,
    down,
  };
}

/**
 * Converts a ParsedTask into a HabiticaTaskPayload ready for the REST API.
 */
export function toHabiticaPayload(parsed: ParsedTask): HabiticaTaskPayload {
  const payload: HabiticaTaskPayload = {
    text: parsed.text,
    type: parsed.type,
  };

  if (parsed.notes) {
    payload.notes = parsed.notes;
  }

  if (parsed.tags && parsed.tags.length > 0) {
    payload.tags = parsed.tags;
  }

  if (parsed.priority !== undefined) {
    payload.priority = parsed.priority;
  }

  if (parsed.type === "habit") {
    payload.up = parsed.up ?? true;
    payload.down = parsed.down ?? false;
  }

  if (parsed.type === "daily") {
    payload.frequency = "daily";
  }

  return payload;
}

/**
 * Parses raw multiline text input into structured tasks and Habitica payloads.
 */
export function parseBatchInput(rawText: string): BatchParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      tasks: [],
      payloads: [],
      stats: {
        total: 0,
        todos: 0,
        dailies: 0,
        habits: 0,
        tagsExtracted: 0,
      },
    };
  }

  const lines = rawText.split(/\r?\n/);
  const tasks: ParsedTask[] = [];

  for (const line of lines) {
    const parsed = parseTaskLine(line);
    if (parsed) {
      tasks.push(parsed);
    }
  }

  const payloads = tasks.map(toHabiticaPayload);
  const totalTags = new Set(tasks.flatMap((t) => t.tags)).size;

  const stats = {
    total: tasks.length,
    todos: tasks.filter((t) => t.type === "todo").length,
    dailies: tasks.filter((t) => t.type === "daily").length,
    habits: tasks.filter((t) => t.type === "habit").length,
    tagsExtracted: totalTags,
  };

  return {
    tasks,
    payloads,
    stats,
  };
}
