// src/allow.ts
import { authorize } from "./authorizer";
import { RequestHandler, Request } from "express";

export function allow(action: string, target: (req: Request) => string): RequestHandler {
    return authorize({ action, target, });
}
