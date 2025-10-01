// src/authorize.ts
import {Request, Response, NextFunction, RequestHandler} from "express";

import { evaluateFlow } from "./evaluator";

import {AuthorizeOptions, User} from "./types";

export function authorize({ action, target }: AuthorizeOptions) : RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user : User = (req as any).user;

            const context = req.body ?? req?.params ?? req?.query;

            if (!user) return res.status(401).json({ error: "Unauthorized" });

            const decision = evaluateFlow(user.policies, {
                user,
                context,
                action,
                target: target(req)
            });

            if (decision === "deny") {
                return res.status(403).json({ error: "Forbidden" });
            }

            next();
        } catch (err) {
            console.log(err)
            next(err);
        }
    };
}
