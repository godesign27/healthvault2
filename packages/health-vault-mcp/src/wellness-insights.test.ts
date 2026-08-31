import assert from "node:assert/strict";
import test from "node:test";
import {
  CHECK_IN_QUESTION_KEYS,
  WellnessInsightSchema,
  answeredQuestionCount,
  containsUnsafeWellnessLanguage,
} from "../../wellness-contracts/src/index.ts";
import { NOURISHED_REBEL_WIDGET_HTML, NOURISHED_REBEL_WIDGET_URI } from "./nourished-rebel.ts";

test("the partner check-in has six stable questions", () => {
  assert.deepEqual(CHECK_IN_QUESTION_KEYS, [
    "sleep", "meal_rhythm", "energy_cravings", "stress", "hydration", "movement",
  ]);
  assert.equal(answeredQuestionCount({ sleep: "Restless", stress: null, movement: "Daily walk" }), 2);
});

test("structured insights require all four pillars and provenance", () => {
  const result = WellnessInsightSchema.safeParse({
    snapshot: "Your routines show a useful place to start.",
    pillars: {
      sleep: { status: "needs_support", summary: "Sleep has felt uneven.", contributingFactors: [], suggestions: ["Keep a consistent wind-down time."] },
      blood_sugar: { status: "needs_support", summary: "Meal rhythm may be contributing to energy swings.", contributingFactors: [], suggestions: ["Pair breakfast with a protein source."] },
      nourishment: { status: "strong", summary: "You are building variety.", contributingFactors: [], suggestions: ["Keep adding colorful whole foods."] },
      stress: { status: "significant_opportunity", summary: "Stress has been running high.", contributingFactors: [], suggestions: ["Try a short pause between tasks."] },
    },
    topPriorities: ["Support a steadier morning rhythm."],
    startingPoints: ["Choose one small change this week."],
    followUpRecommended: false,
    ctaRelevant: true,
    disclaimer: "Wellness guidance from Nourished Rebel, not medical advice.",
    provenance: { frameworkVersion: 1, promptVersion: 1, generatedAt: new Date().toISOString(), sourceKinds: ["check_in"] },
  });
  assert.equal(result.success, true);
});

test("safety screening rejects diagnoses and medication direction", () => {
  assert.equal(containsUnsafeWellnessLanguage("This means you have diabetes."), true);
  assert.equal(containsUnsafeWellnessLanguage("Stop taking your medication."), true);
  assert.equal(containsUnsafeWellnessLanguage("A regular breakfast may support steadier energy."), false);
});

test("the Nourished Rebel widget uses the approved URL and a prominent question heading", () => {
  assert.match(NOURISHED_REBEL_WIDGET_HTML, /https:\/\/nourishedrebel\.com\//);
  assert.doesNotMatch(NOURISHED_REBEL_WIDGET_HTML, /https:\/\/nurishedrebel\.com\//);
  assert.match(NOURISHED_REBEL_WIDGET_HTML, /class="question-label"/);
  assert.match(NOURISHED_REBEL_WIDGET_HTML, /Question '\+current\+' of 6/);
});

test("the MCP exposes an explicit regeneration action and a versioned widget", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./server.ts", import.meta.url), "utf8"));
  assert.match(source, /generate_nourished_rebel_insight/);
  assert.match(source, /callNourishedRebel\(supabase, "generate", \{ force: true \}\)/);
  assert.equal(NOURISHED_REBEL_WIDGET_URI, "ui://health-vault/nourished-rebel-v2.html");
});
