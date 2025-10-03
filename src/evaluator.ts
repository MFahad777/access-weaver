// src/evaluator.ts
import { EvaluationContext, Policy } from "./types";
import { matchTarget, evaluateConditions } from "./utils";

export function evaluateFlow(
    policies: Policy,
    ctx: EvaluationContext
): "allow" | "deny" {
    let decision: "allow" | "deny"  = "deny";

    for (const policy of policies) {
        if (policy.action !== ctx.action) continue;

        if (!matchTarget(policy.target, ctx.target)) continue;

        if (policy.when && !evaluateConditions(policy.when, ctx)) continue;

        if (policy.effect === "deny") return "deny";

        decision = "allow";
    }

    return decision;
}
