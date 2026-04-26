export interface ScoreInputs {
  topic: number;
  source: number;
  actionability: number;
  risk: number;
}

export type ClassifierDecision = "ignore" | "review" | "draft";

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function computeScore({
  topic,
  source,
  actionability,
  risk,
}: ScoreInputs): number {
  const finalScore =
    0.45 * clampScore(topic) +
    0.25 * clampScore(source) +
    0.3 * clampScore(actionability) -
    0.5 * clampScore(risk);

  return clampScore(finalScore);
}

export function decideAction(score: number): ClassifierDecision {
  if (score < 0.3) return "ignore";
  if (score < 0.6) return "review";
  return "draft";
}
