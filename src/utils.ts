// src/utils.ts
import { EvaluationContext, Condition } from "./types";

export function matchTarget(ruleTarget: string, actual: string) {
    if (ruleTarget === actual) return true;
    if (ruleTarget.endsWith("*")) {
        return actual.startsWith(ruleTarget.replace("*", ""));
    }
    return false;
}

export function evaluateConditions(
    when: { all?: Condition[]; any?: Condition[] },
    ctx: EvaluationContext
): boolean {
    const evalOne = (cond: Condition) => {
        const parts = cond.field.split(".");
        let value: any = ctx;
        for (const part of parts) value = value?.[part];

        switch (cond.operator) {
            case "eq": return value === cond.value;
            case "<": return value < cond.value;
            case ">": return value > cond.value;
            case "lte": return value <= cond.value;
            case "gte": return value >= cond.value;
            case "in": return Array.isArray(cond.value) && cond.value.includes(value);
            default: return false;
        }
    };

    if (when.all) return when.all.every(evalOne);
    if (when.any) return when.any.some(evalOne);
    return true;
}
