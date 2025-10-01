// src/evaluator.ts
import { EvaluationContext, Policy } from "./types";
import { matchTarget, evaluateConditions } from "./utils";

export function evaluateFlow(
    policies: Policy,
    ctx: EvaluationContext
): "allow" | "deny" {
    let decision: "allow" | "deny"  = "deny";

    for (const policy of policies) {
        for (const rule of policy.flow) {

            if (rule.action !== ctx.action) continue;

            if (!matchTarget(rule.target, ctx.target)) continue;

            if (rule.when && !evaluateConditions(rule.when, ctx)) continue;

            if (rule.effect === "deny") return "deny";

            decision = "allow";
        }
    }

    return decision;
}
