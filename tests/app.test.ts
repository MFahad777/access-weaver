import express, { Request, Response } from "express";
import request from "supertest";
import { authorize } from "../dist";
import { Policy } from "../dist";

const allowInvoiceRead: Policy = [
    {
        effect: "allow",
        action: "invoice.read",
        target: "invoice:*",
    },
];

const allowInvoiceUpdate: Policy = [
    {
        effect: "allow",
        action: "invoice.update",
        target: "invoice:*",
    },
];

const allowInvoiceSingleUpdate: Policy =  [
    {
        effect: "allow",
        action: "invoice.update",
        target: "invoice:787",
    },
];

const denyInvoiceRead: Policy = [
    {
        effect: "deny",
        action: "invoice.read",
        target: "invoice:*",
    },
];

const allowUserDeleteWithSpecificId: Policy = [
    {
        effect: "allow",
        action: "users.delete",
        target: "users:101",
    },
];

const allowDeleteAnyUser: Policy = [
    {
        effect: "allow",
        action: "users.delete",
        target: "users:*",
    },
];

const allowUserGetAll: Policy = [
    {
        effect: "allow",
        action: "users.read",
        target: "users:*",
    },
];


const allowSingleUserRead: Policy = [
    {
        effect: "allow",
        action: "users.read",
        target: "users:101",
    },
];

// Helper: build an express app with injected policies
function makeApp(policies?: Policy) {
    const app = express();
    app.use(express.json());

    // Fake auth (user injection)
    app.use((req: Request, _res: Response, next) => {
        if (policies) {
            (req as any).user = { id: "u1", roles: ["user"], policies };
        }
        next();
    });

    // Protected route
    app.get(
        "/invoice/:id",
        authorize({
            action: "invoice.read",
            target: (req) => `invoice:${req.params.id}`,
        }),
        (req, res) => {
            res.json({ data: `invoice data for ${req.params.id}` });
        }
    );

    app.put(
        "/invoice/:id",
        authorize({
            action: "invoice.update",
            target: (req) => `invoice:${req.params.id}`,
        }),
        (req, res) => {
            res.json({ data: `invoice data update for Id ${req.params.id}` });
        }
    );

    // Delete Users
    app.delete(
        "/users/delete/:id",
        authorize({
            action: "users.delete",
            target: (req) => `users:${req.params.id}`,
        }),
        (req, res) => {
            res.json({ data: `users deleted with id ${req.params.id}` });
        }
    );

    // Get All Users
    app.get(
        "/users",
        authorize({
            action: "users.read",
            target: (req) => `users:*`,
        }),
        (req, res) => {
            res.json({ data: [{ user:1 }, { user: 2 }, { user: 3 }] });
        }
    );

    // Read Single User
    app.get(
        "/users/:id",
        authorize({
            action: "users.read",
            target: (req) => `users:${req.params.id}`,
        }),
        (req, res) => {
            res.json({ data: { userId : req.params.id } });
        }
    );

    return app;
}

describe("Authorize middleware (additional scenarios)", () => {
    it("should allow invoice read when explicit allow exists", async () => {
        const app = makeApp(allowInvoiceRead);
        const res = await request(app).get("/invoice/555");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: "invoice data for 555" });
    });

    it("should deny invoice read when deny policy is present", async () => {
        const app = makeApp(denyInvoiceRead);
        const res = await request(app).get("/invoice/555");
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Forbidden" });
    });

    it("should prefer deny when both allow and deny exist for same action/target", async () => {
        const conflictPolicy: Policy = [
            ...allowInvoiceRead,
            ...denyInvoiceRead,
        ];
        const app = makeApp(conflictPolicy);
        const res = await request(app).get("/invoice/999");
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Forbidden" });
    });

    it("should allow delete any user with wildcard policy", async () => {
        const app = makeApp(allowDeleteAnyUser);
        const res = await request(app).delete("/users/delete/999");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: "users deleted with id 999" });
    });

    it("should deny if user object is missing (unauthenticated request)", async () => {
        const app = makeApp(undefined); // no user injected
        const res = await request(app).get("/users/101");
        expect(res.status).toBe(401);
    });

    it("should allow multiple actions if defined in one policy", async () => {
        const multiActionPolicy: Policy = [
            {
                effect: "allow",
                action: "users.read",
                target: "users:*",
            },
            {
                effect: "deny",
                action: "invoice.read",
                target: "invoice:*",
            },
            {
                effect: "allow",
                action: "invoice.update",
                target: "invoice:123",
            },
        ];
        const app = makeApp(multiActionPolicy);
        const res1 = await request(app).get("/users");
        const res2 = await request(app).get("/invoice/123");
        const res3 = await request(app).put("/invoice/123");

        expect(res1.status).toBe(200);
        expect(res2.status).toBe(403);
        expect(res3.status).toBe(200);
    });

    it("should allow specific user read even if general read all is missing", async () => {
        const app = makeApp(allowSingleUserRead);
        const res = await request(app).get("/users/101");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: { userId: "101" } });
    });

    it("should deny invoice update when only read is allowed", async () => {
        const app = makeApp(allowInvoiceRead);
        const res = await request(app).put("/invoice/123");
        expect(res.status).toBe(403);
    });

    it("should allow invoice update when update policy exists", async () => {
        const app = makeApp(allowInvoiceUpdate);
        const res = await request(app).put("/invoice/777");
        expect(res.status).toBe(200);
    });

    it("should deny invoice update when id to which the user is allowed is not matched", async () => {
        const app = makeApp(allowInvoiceSingleUpdate);
        const res = await request(app).put("/invoice/777");
        expect(res.status).toBe(403);
    });
});

