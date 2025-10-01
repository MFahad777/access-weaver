# Access Weaver 🧵

**Access Weaver** is a lightweight, declarative **authorization middleware** for Express.js.  
It helps you **weave access control policies** into your routes using simple, rule-based flows.

## ✨ Features

- 🔑 **Declarative rules** with allow / deny effects.

- 🎯 **Resource-based access** with wildcards (\*).

- ⚡ **Express.js middleware** with simple setup.

- 🧩 Flexible targets (static or dynamic from req).

- 🧪 Easy to test with **SuperTest** and Jest.

## 📦 Installation

npm install access-weaver

or

yarn add access-weaver

## ⚡ Quick Start

### 1\. Define Policies

Policies are collections of **flow rules**:

```javascript
const allowInvoiceRead = [
    {
        flow: [
            {
                effect: "allow",
                action: "invoice.read",
                target: "invoice:*",
            },
        ],
    },
];

const denyInvoiceRead = [
    {
        flow: [
            {
                effect: "deny",
                action: "invoice.read",
                target: "invoice:*",
            },
        ],
    },
];
```

### 2. Attach Policies to Users

Attach policies to the req.user object:

```javascript
app.use((req, _res, next) => {
        req.user = {
            id: "u1",
            
            // Use like this
            policies: allowInvoiceRead,
        };
        next();
    }
);
```

### 3. Protect Routes

Use the `authorize` middleware:

```javascript
import express from "express";
import {authorize} from "access-weaver";

const app = express();
app.get(
    "/invoice/:id",
    authorize({
        action: "invoice.read",
        target: (req) => `invoice:${req.params.id}`, // -> always do this when getting single data so that if any policy restrict someone it would work automatically
    }),
    (req, res) => {
        res.json({data: `Invoice data for ${req.params.id}`});
    }
);
```

### 4. More Examples

#### Delete a User

```javascript
app.delete(
    "/users/delete/:id",
    authorize({
        action: "users.delete",
        target: (req) => `users:${req.params.id}`,
    }),
    (req, res) => {
        res.json({data: `User deleted with id ${req.params.id}`});
    }
);
```

#### Read All Users

```javascript
app.get(
    "/users",
    authorize({
        action: "users.read",
        target: () => `users:*`,
    }),
    (req, res) => {
        res.json({data: [{id: 1}, {id: 2}, {id: 3}]});
    }
);
```

#### Read Single User

```javascript
app.get(
    "/users/:id",
    authorize({
        action: "users.read",
        target: (req) => `users:${req.params.id}`,
    }),
    (req, res) => {
        res.json({data: {userId: req.params.id}});
    }
);
```

## 🔒 Example Policies

| Policy Name | Action | Target | Effect | Description |
| --- | --- | --- | --- | --- |
| allowInvoiceRead | invoice.read | invoice:\* | allow | Can read all invoices |
| denyInvoiceRead | invoice.read | invoice:\* | deny | Cannot read invoices |
| allowInvoiceUpdate | invoice.update | invoice:\* | allow | Can update invoices |
| allowUserDeleteWithSpecificId | users.delete | users:101 | allow | Can delete only user with ID 101 |
| allowDeleteAnyUser | users.delete | users:\* | allow | Can delete any user |
| allowUserGetAll | users.read | users:\* | allow | Can read all users |
| allowSingleUserRead | users.read | users:101 | allow | Can only read user with ID 101 |

## 🧪 Testing

```javascript
import request from "supertest";

it("should allow invoice read when policy permits", async () => {
    const app = makeApp(allowInvoiceRead);
    const res = await request(app).get("/invoice/123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({data: "Invoice data for 123"});
});
```

## 🤝 Contributing

PRs and issues are welcome! 🎉  
If you find a bug or want a feature, open an [issue](https://github.com/your-repo/access-weaver/issues).

## 📜 License

MIT © 2025