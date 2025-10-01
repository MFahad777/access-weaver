import {Request} from "express";

export interface Condition {
    field: string;
    operator: "eq" | "<" | ">" | "lte" | "gte" | "in";
    value: any;
}

export interface FlowRule {
    effect: "allow" | "deny";
    action: string;
    target: string;
    when?: {
        all?: Condition[];
        any?: Condition[];
    };
}

export type Policy = { flow: FlowRule[] }[]

export interface EvaluationContext {
    user: any;
    context: any;
    action: string;
    target: string;
}

export interface AuthorizeOptions {
    action: string;
    target: (req: Request) => string;
}

export type User = {
    policies: Policy
}
