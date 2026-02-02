
import httpStatus from "http-status";
import request from "supertest";
import app from "../../src/app";
import { adminAccessToken } from "../fixtures/token.fixture";
import { insertUsers, admin, userOne, userTwo } from "../fixtures/user.fixture";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("User Search", () => {
    test("should correctly search for 'System Admin' using search param", async () => {
        // Create users:
        // admin: default 'admin' role
        // userOne: 'user' role
        // Let's create a custom user named "System Admin"
        const systemAdmin = {
            ...userOne,
            _id: undefined, // Let mongoose generate ID
            first_name: "System",
            last_name: "Admin",
            email: "sysadmin@example.com",
            role: "user"
        };

        // We need to use 'insertUsers' helper but it takes fixed fixtures.
        // We can use User model directly or adapt fixtures.
        // Let's just use existing fixtures and search for them.
        // userOne: first_name: (faker), last_name: (faker)
        // admin: first_name: (faker)...

        // We can't predict faker names unless we force them.
        // So let's insert specific data.
        const userA = { ...userOne, first_name: "System", last_name: "Admin", email: "sysadmin@example.com" };
        const userB = { ...userTwo, first_name: "Updated", last_name: "Admin", email: "updated@example.com" };

        await insertUsers([admin, userA, userB]);

        const res = await request(app)
            .get("/v1/users")
            .set("Authorization", `Bearer ${adminAccessToken}`)
            .query({ search: "System Admin" })
            .send()
            .expect(httpStatus.OK);

        expect(res.body.data.results).toHaveLength(1);
        expect(res.body.data.results[0].email).toBe("sysadmin@example.com");

        const res2 = await request(app)
            .get("/v1/users")
            .set("Authorization", `Bearer ${adminAccessToken}`)
            .query({ search: "Updated Admin" })
            .send()
            .expect(httpStatus.OK);

        expect(res2.body.data.results).toHaveLength(1);
        expect(res2.body.data.results[0].email).toBe("updated@example.com");
    });

    test("should match partial terms across fields", async () => {
        const userC = { ...userOne, first_name: "John", last_name: "Doe", email: "john.doe@test.com" };
        await insertUsers([admin, userC]);

        // Search "John test" -> matches first_name "John" and email "...test..."
        const res = await request(app)
            .get("/v1/users")
            .set("Authorization", `Bearer ${adminAccessToken}`)
            .query({ search: "John test" })
            .send()
            .expect(httpStatus.OK);

        expect(res.body.data.results).toHaveLength(1);
        expect(res.body.data.results[0].email).toBe("john.doe@test.com");
    });
});
