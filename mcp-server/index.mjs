#!/usr/bin/env node

/**
 * Brio Model Context Protocol (MCP) Server
 * Stdio-based server providing autonomous Antigravity agents with direct access
 * to Brio project tasks, checklist execution, and /definir integrations.
 */

import readline from "node:readline";
import path from "node:path";

const BRIO_API_URL = (process.env.BRIO_API_URL || "https://brio-sand.vercel.app").replace(/\/+$/, "");
const BRIO_AGENT_TOKEN = process.env.BRIO_AGENT_TOKEN || "";

/**
 * Logs diagnostics to stderr so it doesn't pollute stdout JSON-RPC stream.
 */
function log(...args) {
  console.error("[brio-mcp-server]", ...args);
}

/**
 * Helper to call Brio API with authentication
 */
async function callBrio(endpoint, options = {}) {
  const url = `${BRIO_API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (BRIO_AGENT_TOKEN) {
    headers["Authorization"] = `Bearer ${BRIO_AGENT_TOKEN}`;
    headers["x-brio-token"] = BRIO_AGENT_TOKEN;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const errorMsg = data?.error || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Resolves project name either from parameter or from current working directory
 */
function resolveProjectName(specifiedProject) {
  if (specifiedProject && specifiedProject.trim()) {
    return specifiedProject.trim();
  }
  const cwd = process.cwd();
  return path.basename(cwd);
}

// ----------------------------------------------------------------------
// Tool Definitions
// ----------------------------------------------------------------------

const TOOLS = [
  {
    name: "brio_get_project_tasks",
    description:
      "Retrieves tasks for a Brio project. If project is not specified, auto-detects from the current workspace directory. Returns task IDs, titles, full markdown specifications, and checklist items.",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description:
            "Project name, slug (e.g. 'kittnos'), canonical prefix (e.g. '[Kittn OS]'), or Brio ID. If omitted, uses current workspace folder name.",
        },
        status: {
          type: "string",
          enum: ["pending", "completed", "all"],
          default: "pending",
          description: "Filter tasks by status. Default is 'pending'.",
        },
      },
    },
  },
  {
    name: "brio_complete_task",
    description:
      "Marks a task as completed in Brio and Habitica upon finishing implementation.",
    inputSchema: {
      type: "object",
      required: ["taskId"],
      properties: {
        taskId: {
          type: "string",
          description: "The unique ID of the task to complete.",
        },
      },
    },
  },
  {
    name: "brio_toggle_checklist_item",
    description:
      "Marks or toggles an individual subtask (checklist item) as completed as the agent progresses.",
    inputSchema: {
      type: "object",
      required: ["taskId", "checklistId"],
      properties: {
        taskId: {
          type: "string",
          description: "The unique ID of the parent task.",
        },
        checklistId: {
          type: "string",
          description: "The unique ID of the checklist item/subtask.",
        },
      },
    },
  },
  {
    name: "brio_create_task",
    description:
      "Creates a new task in Brio/Habitica for the specified project with full markdown technical specifications and optional checklist items (used by /definir or manual task creation).",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: {
          type: "string",
          description: "The title of the task.",
        },
        project: {
          type: "string",
          description:
            "Project name or slug. If omitted, auto-detected from workspace folder.",
        },
        notes: {
          type: "string",
          description:
            "Detailed technical specification or meta-prompt in markdown format.",
        },
        checklist: {
          type: "array",
          items: { type: "string" },
          description: "List of subtasks/checklist items.",
        },
        priority: {
          type: "string",
          enum: ["trivial", "easy", "medium", "hard", "urgent"],
          default: "medium",
          description: "Task difficulty/priority in Habitica.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for the task.",
        },
      },
    },
  },
  {
    name: "brio_update_task",
    description: "Updates an existing task's title, markdown notes, or priority in Brio.",
    inputSchema: {
      type: "object",
      required: ["taskId"],
      properties: {
        taskId: {
          type: "string",
          description: "The unique ID of the task to update.",
        },
        title: {
          type: "string",
          description: "New title for the task.",
        },
        notes: {
          type: "string",
          description: "Updated markdown notes or specification.",
        },
        priority: {
          type: "number",
          description: "Numeric priority (0.1, 1, 1.5, 2).",
        },
      },
    },
  },
];

// ----------------------------------------------------------------------
// Tool Execution Handler
// ----------------------------------------------------------------------

async function handleToolCall(name, args) {
  switch (name) {
    case "brio_get_project_tasks": {
      const proj = resolveProjectName(args?.project);
      const status = args?.status || "pending";
      const data = await callBrio(`/api/agent/projects/${encodeURIComponent(proj)}/tasks?status=${status}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    case "brio_complete_task": {
      if (!args?.taskId) throw new Error("Argument 'taskId' is required.");
      const data = await callBrio(`/api/agent/tasks/${encodeURIComponent(args.taskId)}/complete`, {
        method: "POST",
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    case "brio_toggle_checklist_item": {
      if (!args?.taskId || !args?.checklistId) {
        throw new Error("Arguments 'taskId' and 'checklistId' are required.");
      }
      const data = await callBrio(
        `/api/agent/tasks/${encodeURIComponent(args.taskId)}/checklist/${encodeURIComponent(args.checklistId)}`,
        { method: "POST" }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    case "brio_create_task": {
      if (!args?.title) throw new Error("Argument 'title' is required.");
      const proj = resolveProjectName(args?.project);
      const payload = {
        title: args.title,
        notes: args.notes || "",
        checklist: args.checklist || [],
        priority: args.priority || "medium",
        tags: args.tags || [],
      };
      const data = await callBrio(`/api/agent/projects/${encodeURIComponent(proj)}/tasks`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    case "brio_update_task": {
      if (!args?.taskId) throw new Error("Argument 'taskId' is required.");
      const payload = {};
      if (args.title) payload.title = args.title;
      if (args.notes !== undefined) payload.notes = args.notes;
      if (args.priority !== undefined) payload.priority = args.priority;

      const data = await callBrio(`/api/agent/tasks/${encodeURIComponent(args.taskId)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: '${name}'`);
  }
}

// ----------------------------------------------------------------------
// JSON-RPC 2.0 Stdio Loop
// ----------------------------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let message;
  try {
    message = JSON.parse(line);
  } catch (err) {
    log("Failed to parse JSON input:", err);
    return;
  }

  const { id, method, params } = message;

  // Notification (no ID)
  if (id === undefined || id === null) {
    if (method === "notifications/initialized") {
      log("Client initialized successfully.");
    }
    return;
  }

  try {
    if (method === "initialize") {
      sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "brio-mcp-server",
          version: "1.0.0",
        },
      });
      return;
    }

    if (method === "ping") {
      sendResponse(id, {});
      return;
    }

    if (method === "tools/list") {
      sendResponse(id, { tools: TOOLS });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = await handleToolCall(toolName, toolArgs);
      sendResponse(id, result);
      return;
    }

    sendError(id, -32601, `Method '${method}' not found`);
  } catch (err) {
    log(`Error handling method '${method}':`, err);
    sendResponse(id, {
      content: [
        {
          type: "text",
          text: `Error executing tool: ${err.message}`,
        },
      ],
      isError: true,
    });
  }
});

function sendResponse(id, result) {
  const payload = {
    jsonrpc: "2.0",
    id,
    result,
  };
  process.stdout.write(JSON.stringify(payload) + "\n");
}

function sendError(id, code, message) {
  const payload = {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  };
  process.stdout.write(JSON.stringify(payload) + "\n");
}

log("Brio MCP server running over stdio.");
