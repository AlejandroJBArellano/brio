import { HabiticaTask } from "./types";

export interface ParsedTaskMetadata {
  notionId?: string;
  notionUrl?: string;
  notionStatus?: string;
  notionCategory?: string;
  notionHours?: string;
  notionTicketId?: string;
  priorityLevel: "urgent" | "high" | "medium" | "low" | "trivial";
  priorityLabel: string;
  priorityColor: {
    badge: string;
    border: string;
    text: string;
  };
  cleanNotes: string;
}

/**
 * Extracts rich metadata from Habitica task notes and properties.
 * Handles Notion sync tags, custom formats, priority mapping, and URL extraction.
 */
export function parseTaskMetadata(task: HabiticaTask): ParsedTaskMetadata {
  const notes = task.notes || "";

  // 1. Notion ID
  const notionIdMatch = notes.match(/<!--\s*notion_id:\s*([a-f0-9\-]+)\s*-->/i);
  const notionId = notionIdMatch ? notionIdMatch[1] : undefined;

  // 2. Notion URL
  const notionUrlMatch =
    notes.match(/https:\/\/(?:app\.)?notion\.(?:so|com)\/([a-zA-Z0-9\-_\/]+)/) ||
    notes.match(/\[(?:Ver[^\]]*Notion)\]\((https:\/\/[^\)]+)\)/i);
  const notionUrl = notionUrlMatch ? notionUrlMatch[0].replace(/[\]\)]/g, "") : undefined;

  // 3. Notion Status
  const statusMatch =
    notes.match(/(?:Estado(?:\s*en\s*Notion)?|Status):\s*\[?([a-zA-Z\s]+)\]?/i) ||
    notes.match(/\*\*Estado[^\*]*\*\*:\s*([^\n\r]+)/i);
  const notionStatus = statusMatch ? statusMatch[1].trim() : undefined;

  // 4. Notion Category / Type
  const catMatch =
    notes.match(/(?:Tipo|Categoría|Category):\s*\[?([a-zA-Z\s]+)\]?/i) ||
    notes.match(/\*\*Categoría[^\*]*\*\*:\s*([^\n\r]+)/i);
  const notionCategory = catMatch ? catMatch[1].trim() : undefined;

  // 5. Notion Hours
  const hoursMatch = notes.match(/Horas:\s*([0-9\.]+h?)/i);
  const notionHours = hoursMatch ? hoursMatch[1].trim() : undefined;

  // 6. Notion Ticket ID
  const ticketMatch =
    notes.match(/Ticket\s*ID:\s*#?([a-zA-Z0-9]+)/i) ||
    notes.match(/\*\*Ticket ID\*\*:\s*#?([a-zA-Z0-9]+)/i);
  const notionTicketId = ticketMatch ? ticketMatch[1].trim() : undefined;

  // 7. Priority Mapping
  // Habitica: 0.1 = Trivial, 1 = Easy, 1.5 = Medium, 2 = Hard
  const prioVal = task.priority ?? 1.5;
  let priorityLevel: "urgent" | "high" | "medium" | "low" | "trivial" = "medium";
  let priorityLabel = "Media";
  let priorityColor = {
    badge: "bg-[#221D16] border-[#D99B43]/30 text-[#D99B43]",
    border: "border-[#D99B43]/40",
    text: "text-[#D99B43]",
  };

  if (prioVal >= 2) {
    priorityLevel = "high";
    priorityLabel = "Alta";
    priorityColor = {
      badge: "bg-[#251417] border-[#E5484D]/30 text-[#FF6369]",
      border: "border-[#E5484D]/40",
      text: "text-[#FF6369]",
    };
  } else if (prioVal <= 0.5) {
    priorityLevel = "trivial";
    priorityLabel = "Trivial";
    priorityColor = {
      badge: "bg-[#181715] border-[#38332D] text-[#8E867B]",
      border: "border-[#38332D]",
      text: "text-[#8E867B]",
    };
  } else if (prioVal <= 1) {
    priorityLevel = "low";
    priorityLabel = "Baja";
    priorityColor = {
      badge: "bg-[#141813] border-[#7EA35A]/30 text-[#7EA35A]",
      border: "border-[#7EA35A]/40",
      text: "text-[#7EA35A]",
    };
  }

  // 8. Clean Notes (remove raw system tags for cleaner display)
  const cleanNotes = notes
    .replace(/<!--\s*notion_id:[^>]*-->/gi, "")
    .replace(/\[Ver tarea en Notion\]\([^\)]+\)/gi, "")
    .trim();

  return {
    notionId,
    notionUrl,
    notionStatus,
    notionCategory,
    notionHours,
    notionTicketId,
    priorityLevel,
    priorityLabel,
    priorityColor,
    cleanNotes,
  };
}
