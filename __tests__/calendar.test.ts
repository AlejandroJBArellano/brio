import { parseICalFeed } from "../lib/calendar";
import assert from "node:assert";
import test from "node:test";

test("Calendar - parse simple iCal VEVENT", () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");

  const icsSample = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
UID:sample-event-1@google.com
DTSTART:${y}${m}${d}T150000Z
DTEND:${y}${m}${d}T160000Z
SUMMARY:Daily Strategy & Engineering Sync
DESCRIPTION:Revisión de arquitectura y avances
LOCATION:Google Meet
END:VEVENT
END:VCALENDAR`;

  const result = parseICalFeed(icsSample, today);
  assert.strictEqual(result.events.length, 1);
  assert.strictEqual(result.events[0].title, "Daily Strategy & Engineering Sync");
  assert.strictEqual(result.events[0].durationMinutes, 60);
  assert.strictEqual(result.events[0].location, "Google Meet");
});
