import {evaluateFlow} from "../dist";
import {Policy} from "../dist";

describe("evaluateFlow", () => {
    const baseContext = {
        user: {id: "u1", roles: ["manager"]},
        context: {amount: 3000, invoiceId: "inv-101"},
        action: "invoice.approve",
        target: "invoice:inv-101"
    };

    test("should allow when rule matches and conditions satisfied", () => {
        const policies: Policy = [
            {
                effect: "allow",
                action: "invoice.approve",
                target: "invoice:*",
                when: {
                    all: [{field: "context.amount", operator: "lte", value: 5000}]
                }
            }
        ];

        const decision = evaluateFlow(policies, baseContext);
        expect(decision).toBe("allow");
    });

    test("should deny when condition not satisfied", () => {
        const policies: Policy = [
            {
                effect: "allow",
                action: "invoice.approve",
                target: "invoice:*",
                when: {
                    all: [{field: "context.amount", operator: "lte", value: 1000}]
                }
            }
        ];

        const decision = evaluateFlow(policies, baseContext);
        expect(decision).toBe("deny");
    });

    test("should deny when explicit deny exists", () => {
        const policies: Policy = [
            {
                effect: "deny",
                action: "invoice.approve",
                target: "invoice:*"
            }
        ];

        const decision = evaluateFlow(policies, baseContext);
        expect(decision).toBe("deny");
    });

    test("should allow when OR condition satisfied", () => {
        const policies: Policy = [
            {
                effect: "allow",
                action: "invoice.approve",
                target: "invoice:*",
                when: {
                    any: [
                        {field: "context.amount", operator: "lte", value: 1000},
                        {field: "context.invoiceId", operator: "eq", value: "inv-101"}
                    ]
                }
            }
        ];

        const decision = evaluateFlow(policies, baseContext);
        expect(decision).toBe("allow");
    });

    test("should deny if no flow match", () => {
        const policies: Policy = [
            {
                effect: "allow",
                action: "user.delete",
                target: "user:*"
            }
        ];

        const decision = evaluateFlow(policies, baseContext);
        expect(decision).toBe("deny"); // default deny
    });

    test("should handle multiple policies", () => {
        const policies: Policy = [
            {
                effect: "allow",
                action: "invoice.approve",
                target: "invoice:*",
                when: {
                    all: [{field: "context.amount", operator: "lte", value: 5000}]
                }
            },
            {
                effect: "deny",
                action: "invoice.approve",
                target: "invoice:inv-999" // doesn't match current target
            }
        ];

        const decision = evaluateFlow(policies, baseContext);
        expect(decision).toBe("allow");
    });
});
