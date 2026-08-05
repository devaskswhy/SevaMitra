# Case Study: The Allocation-Scoring Algorithm

`apps/api/src/services/allocationEngine.ts` is the piece of SevaMitra that answers one question: **given a task (or an incident) and a shift, which volunteer should do it?** Two endpoints call into it — `POST /api/allocation/recommendations`, which returns a ranked list for a coordinator to review, and `POST /api/incidents/:id/deploy`, which auto-picks the top candidate and deploys them immediately.

## The problem

A large event like Mahakumbh has thousands of volunteers with different skills, different reliability track records, different home states, and different current workloads. Picking a volunteer by hand for every incident doesn't scale. The allocation engine turns that decision into a weighted score so it can be automated, while still being explainable — a coordinator can see *why* a given volunteer was ranked first.

## The algorithm

Each active volunteer is scored 0-100 on five factors, then combined into a single weighted total:

| Factor | Weight | What it measures |
|---|---|---|
| Skills match | 30% | What fraction of the task's required skills (comma-separated tags like `first_aid,medical`) the volunteer has. |
| Reliability | 25% | The volunteer's existing reliability score, boosted up to 30 points for completed shifts (5 points each, capped). |
| Availability | 20% | 100 if the volunteer has no overlapping shift assignment, 50 for one conflict, 0 for more than one. |
| Location proximity | 15% | See [the honest limitation](#honest-limitation-proximity-is-a-string-match-not-geodistance) below. |
| Workload balance | 10% | 100 if the volunteer has no active assignments, decreasing linearly up to a 5-assignment ceiling. |

```
totalScore = skills*0.30 + reliability*0.25 + availability*0.20 + proximity*0.15 + workload*0.10
```

The top *N* scores (sorted descending, zero-and-below filtered out) become the recommendation list. `autoAllocateTask` and the incident-deploy route both build on the same scoring function — deploy just takes the #1 result and creates the `Assignment` automatically instead of leaving the choice to a coordinator.

Skills match, reliability, and proximity are pure functions of their inputs (no database access), which is exactly why they're the unit-tested surface in `apps/api/src/services/__tests__/allocationEngine.test.ts` — deterministic, fast, and the highest-signal thing to get right, since they're the ones humans can actually reason about and verify. Availability and workload hit Prisma directly (they need to know about *other* assignments), so they're covered instead by the integration tests exercising the real HTTP endpoints end-to-end.

## Honest limitation: proximity is a string match, not geodistance

`calculateProximityScore` does this:

```ts
if (homeStateNorm === zoneNorm) return 100;       // exact state-name match
if (homeStateNorm.includes("state") && zoneNorm.includes("state")) return 75; // "adjacent" — not real
return 50;                                         // different regions
```

This is not geographic proximity. It's a case-insensitive string comparison between a volunteer's `homeState` field and a zone's `coordinates` field (which, despite the name, is currently just a free-text location string, not lat/lng). Two real consequences:

1. **A volunteer in Kanpur (Uttar Pradesh) and a zone in Prayagraj (also Uttar Pradesh) score identically to a volunteer already standing next to the zone** — same-state is same-state regardless of actual distance, which can be hundreds of kilometers at Mahakumbh's scale.
2. **The "adjacent states" branch (75) is essentially decorative.** It only fires when both strings literally contain the substring `"state"` — e.g. `"Some State"` — which real Indian state names (`"Uttar Pradesh"`, `"Bihar"`) never do. In practice this branch almost never executes against real data; every non-exact-match pair falls through to the neutral 50.

The honest fix is to replace `homeState`/`coordinates` with real latitude/longitude on both `Volunteer` and `Zone`, and score proximity with an actual distance function (haversine, or a bucketed distance tier) instead of string equality. That's tracked as the first item in the README's roadmap — it wasn't done here because it's a schema change with migration and seed-data implications well outside a portfolio-readiness pass that's explicitly scoped to not touch application behavior.

## Why call this out at all

It would have been easy to write this case study around the 30/25/20/15/10 weighting scheme and stop there. The weighting is the least interesting part — it's five numbers that sum to one. The actual engineering judgment call worth showing is knowing which 15% of the score is doing less than it appears to, and saying so plainly instead of letting "location proximity (15%)" imply more precision than the implementation delivers.
