import { parseBatchInput, parseTaskLine } from "../lib/parser";
import assert from "node:assert";
import test from "node:test";

test("Parser - standard todo without tags", () => {
  const result = parseTaskLine("Buy groceries");
  assert.ok(result);
  assert.strictEqual(result.text, "Buy groceries");
  assert.strictEqual(result.type, "todo");
  assert.deepStrictEqual(result.tags, []);
  assert.strictEqual(result.notes, undefined);
});

test("Parser - tagged todo", () => {
  const result = parseTaskLine("Finish landing page #work #urgent");
  assert.ok(result);
  assert.strictEqual(result.text, "Finish landing page");
  assert.strictEqual(result.type, "todo");
  assert.deepStrictEqual(result.tags, ["work", "urgent"]);
});

test("Parser - daily format with asterisk", () => {
  const result = parseTaskLine("* Read 20 pages #growth");
  assert.ok(result);
  assert.strictEqual(result.text, "Read 20 pages");
  assert.strictEqual(result.type, "daily");
  assert.deepStrictEqual(result.tags, ["growth"]);
});

test("Parser - positive habit format with +", () => {
  const result = parseTaskLine("+ Drink water");
  assert.ok(result);
  assert.strictEqual(result.text, "Drink water");
  assert.strictEqual(result.type, "habit");
  assert.strictEqual(result.up, true);
  assert.strictEqual(result.down, false);
});

test("Parser - negative habit format with -", () => {
  const result = parseTaskLine("- Eat junk food");
  assert.ok(result);
  assert.strictEqual(result.text, "Eat junk food");
  assert.strictEqual(result.type, "habit");
  assert.strictEqual(result.up, false);
  assert.strictEqual(result.down, true);
});

test("Parser - dual habit format with +-", () => {
  const result = parseTaskLine("+- Stairs vs Elevator");
  assert.ok(result);
  assert.strictEqual(result.text, "Stairs vs Elevator");
  assert.strictEqual(result.type, "habit");
  assert.strictEqual(result.up, true);
  assert.strictEqual(result.down, true);
});

test("Parser - notes extraction with //", () => {
  const result = parseTaskLine(
    "Submit Q3 report #finance // Include charts and executive summary"
  );
  assert.ok(result);
  assert.strictEqual(result.text, "Submit Q3 report");
  assert.strictEqual(result.notes, "Include charts and executive summary");
  assert.deepStrictEqual(result.tags, ["finance"]);
});

test("Parser - priority extraction", () => {
  const result = parseTaskLine("Deploy hotfix !urgent #prod");
  assert.ok(result);
  assert.strictEqual(result.text, "Deploy hotfix");
  assert.strictEqual(result.priority, 2);
  assert.deepStrictEqual(result.tags, ["prod"]);
});

test("Parser - batch multiline parsing", () => {
  const raw = `
Buy groceries #errands
* Morning meditation #mindfulness
+ Drink 2L water
- Mindless scrolling
Deploy to production !hard #work // Review logs first
  `;

  const parsed = parseBatchInput(raw);
  assert.strictEqual(parsed.tasks.length, 5);
  assert.strictEqual(parsed.stats.todos, 2);
  assert.strictEqual(parsed.stats.dailies, 1);
  assert.strictEqual(parsed.stats.habits, 2);
  assert.strictEqual(parsed.stats.total, 5);
});
