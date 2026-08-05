import AllocationEngine from "../allocationEngine";

// The scoring helpers are private (pure, deterministic, no Prisma calls) —
// reached here via an `any` cast rather than changing their visibility,
// since that's the smallest change that makes them testable without
// touching allocationEngine.ts's public surface or behavior.
const engine = AllocationEngine as any;

describe("AllocationEngine.calculateSkillsMatch", () => {
  it("returns 100 when the task has no required skills", () => {
    expect(engine.calculateSkillsMatch("first_aid,medical", "")).toBe(100);
  });

  it("returns 100 when every required skill is present", () => {
    expect(engine.calculateSkillsMatch("first_aid,medical,general", "first_aid,medical")).toBe(100);
  });

  it("returns a proportional score for a partial match", () => {
    expect(engine.calculateSkillsMatch("first_aid", "first_aid,medical")).toBe(50);
  });

  it("returns 0 when no required skill is present", () => {
    expect(engine.calculateSkillsMatch("technical", "first_aid,medical")).toBe(0);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(engine.calculateSkillsMatch("First_Aid, Medical ", " first_aid , medical")).toBe(100);
  });
});

describe("AllocationEngine.calculateReliabilityScore", () => {
  it("returns the base score unchanged when there are no completed shifts", () => {
    expect(engine.calculateReliabilityScore(60, 0)).toBe(60);
  });

  it("boosts the score by 5 points per completed shift", () => {
    expect(engine.calculateReliabilityScore(50, 3)).toBe(65);
  });

  it("caps the shift boost at 30 points regardless of shift count", () => {
    expect(engine.calculateReliabilityScore(50, 100)).toBe(80);
  });

  it("caps the total score at 100", () => {
    expect(engine.calculateReliabilityScore(90, 10)).toBe(100);
  });
});

describe("AllocationEngine.calculateProximityScore", () => {
  it("returns 50 (neutral) when the zone has no location data", () => {
    expect(engine.calculateProximityScore("Uttar Pradesh", "")).toBe(50);
  });

  it("returns 100 for an exact, case/whitespace-insensitive state match", () => {
    expect(engine.calculateProximityScore(" Uttar Pradesh ", "uttar pradesh")).toBe(100);
  });

  it("returns 50 for genuinely different states", () => {
    // Honest limitation: this is a crude string match, not real geodistance
    // — see docs/case-study-allocation-engine.md.
    expect(engine.calculateProximityScore("Bihar", "Maharashtra")).toBe(50);
  });

  it("returns 75 when both strings merely contain the literal word 'state'", () => {
    // Documents the current (fairly arbitrary) "adjacent states" heuristic
    // rather than asserting it's correct — it isn't real adjacency logic.
    expect(engine.calculateProximityScore("Some State", "Another State")).toBe(75);
  });
});
