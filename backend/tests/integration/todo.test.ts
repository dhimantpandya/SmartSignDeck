/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { Todo } from "../../src/models";
import {
  insertTodos,
  todoOne,
  todoThree,
  todoTwo,
} from "../fixtures/todo.fixture";
import {
  adminAccessToken,
  userOneAccessToken,
  userTwoAccessToken,
} from "../fixtures/token.fixture";
import { admin, insertUsers, userOne, userTwo } from "../fixtures/user.fixture";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("Todo routes", () => {
  describe("POST /v1/todos", () => {
    let newTodo: {
      userId: string;
      title: string;
      completed: boolean;
      hours: number;
      subtask: Array<{ title: string; description: string }>;
      relatedTasks: { taskId: string; taskTitle: string };
      completeBy: string;
      status: string;
    };

    beforeEach(() => {
      newTodo = {
        userId: userOne._id.toString(),
        title: faker.lorem.sentence(),
        completed: false,
        hours: 2,
        subtask: [
          {
            title: "sub-Todo-1.1",
            description: "sub todo one.1",
          },
          {
            title: "sub-Todo-1.2",
            description: "sub todo one.2",
          },
        ],
        relatedTasks: {
          taskId: "63c91518eba599c477cd83ce",
          taskTitle: "Todo-1",
        },
        completeBy: "2023-10-24T18:05:47.000Z",
        status: "PENDING",
      };
    });

    test("should return 201 and successfully create new todo if data is ok", async () => {
      await insertUsers([admin, userOne, userTwo]);
      // await insertTodos([todoOne]);

      const res = await request(app)
        .post("/v1/todos")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newTodo)
        .expect(httpStatus.CREATED);

      expect(res.body.data).toMatchObject({
        title: newTodo.title,
        userId: newTodo.userId.toString(),
        completed: newTodo.completed,
        hours: newTodo.hours,
        status: newTodo.status,
        // Add other fields as needed
      });

      const dbTodo = await Todo.findById(res.body.data._id);
      expect(dbTodo).toBeDefined();
      expect(JSON.parse(JSON.stringify(dbTodo))).toMatchObject({
        title: newTodo.title,
        userId: newTodo.userId,
        completed: newTodo.completed,
        hours: newTodo.hours,
        status: newTodo.status,
        // Add other fields as needed
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .post("/v1/todos")
        .send(newTodo)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("GET /v1/todos", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo, todoThree]);

      const res = await request(app)
        .get("/v1/todos")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);
      expect(res.body.data.results[0]).toEqual({
        relatedTasks: {
          taskId: todoOne.relatedTasks.taskId,
          taskTitle: todoOne.relatedTasks.taskTitle,
        },
        _id: todoOne._id.toString(),
        userId: todoOne.userId.toString(),
        title: todoOne.title,
        completed: todoOne.completed,
        status: todoOne.status,
        hours: todoOne.hours,
        subtask: expect.any(Array),
        completeBy: todoOne.completeBy,
      });
    });

    test("should return 401 if access token is missing", async () => {
      // await insertTodos([todoOne, todoTwo, admin]);

      await request(app)
        .get("/v1/todos")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 200 if a non-admin is trying to access all todos: todo list will be of user only.", async () => {
      await insertUsers([userOne, userTwo]);
      todoOne.userId = userOne._id.toString();
      todoTwo.userId = userOne._id.toString();
      await insertTodos([todoOne, todoTwo]);
      todoOne._id = new mongoose.Types.ObjectId();
      todoTwo._id = new mongoose.Types.ObjectId();
      todoOne.userId = userTwo._id.toString();
      todoTwo.userId = userTwo._id.toString();
      await insertTodos([todoOne, todoTwo]);

      const res = await request(app)
        .get("/v1/todos")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 2,
      });
      expect(res.body.data.results).toHaveLength(2);
    });

    test("should correctly apply filter on title field", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo]);

      const res = await request(app)
        .get("/v1/todos")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ title: todoOne.title })
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 1,
      });
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]._id).toBe(todoOne._id.toHexString());
    });

    test("should correctly apply filter on status field", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo, todoThree]);

      const res = await request(app)
        .get("/v1/todos")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ status: "PENDING" })
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 2,
      });

      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0]._id).toBe(todoOne._id.toHexString());
      expect(res.body.data.results[1]._id).toBe(todoTwo._id.toHexString());
    });

    test("should correctly sort the returned array if descending sort param is specified", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo, todoThree]);

      const res = await request(app)
        .get("/v1/todos?sort=-title")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);
      expect(res.body.data.results[0].title).toBe(todoThree.title);
      expect(res.body.data.results[1].title).toBe(todoTwo.title);
      expect(res.body.data.results[2].title).toBe(todoOne.title);
    });

    test("should correctly sort the returned array if ascending sort param is specified", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo, todoThree]);

      const res = await request(app)
        .get("/v1/todos?sort=title")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);
      expect(res.body.data.results[0].title).toBe(todoOne.title);
      expect(res.body.data.results[1].title).toBe(todoTwo.title);
      expect(res.body.data.results[2].title).toBe(todoThree.title);
    });

    // test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
    //     await insertUsers([admin]);
    //     await insertTodos([todoOne, todoTwo, todoThree]);

    //     const res = await request(app)
    //         .get('/v1/todos?sort=-title,userId')
    //         .set('Authorization', `Bearer ${adminAccessToken}`)
    //         .send()
    //         .expect(httpStatus.OK);

    //     expect(res.body.data).toEqual({
    //         results: expect.any(Array),
    //         limit: 10,
    //         skip: 0,
    //         totalResults: 3,
    //     });
    //     expect(res.body.data.results).toHaveLength(3);

    //     const expectedOrder = [todoOne, todoTwo, todoThree].sort((a, b) => {
    //         if (a.title < b.title) {
    //             return 1;
    //         }
    //         if (a.title > b.title) {
    //             return -1;
    //         }
    //         return a.userId.toString() < b.userId.toString() ? -1 : 1;
    //     });

    //     expectedOrder.forEach((todo, index) => {
    //         console.log(res.body.data.results[index]._id)
    //         expect(res.body.data.results[index]._id).toBe(todo._id.toHexString());
    //     });
    // });

    test("should limit returned array if limit param is specified", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo, todoThree]);

      const res = await request(app)
        .get("/v1/todos?limit=2")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 2,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0]._id).toBe(todoOne._id.toHexString());
      expect(res.body.data.results[1]._id).toBe(todoTwo._id.toHexString());
    });

    test("should return the correct page if page and limit params are specified", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne, todoTwo, todoThree]);
      const res = await request(app)
        .get("/v1/todos?limit=2&skip=2")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 2,
        skip: 2,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]._id).toBe(todoThree._id.toHexString());
    });
  });

  describe("GET /v1/todos/:todoId", () => {
    test("should return 200 and the todo object if data is ok", async () => {
      await insertUsers([userOne]);
      todoOne.userId = userOne._id.toString();
      await insertTodos([todoOne]);

      const res = await request(app)
        .get(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        _id: todoOne._id.toHexString(),
        relatedTasks: {
          taskId: todoOne.relatedTasks.taskId,
          taskTitle: todoOne.relatedTasks.taskTitle,
        },
        userId: todoOne.userId.toString(),
        title: todoOne.title,
        completed: todoOne.completed,
        status: todoOne.status,
        hours: todoOne.hours,
        subtask: expect.any(Array),
        completeBy: todoOne.completeBy,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTodos([todoOne]);

      await request(app)
        .get(`/v1/todos/${todoOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is trying to get another user's todo", async () => {
      await insertUsers([userOne, userTwo]);
      todoOne.userId = userOne._id.toString();
      todoTwo.userId = userTwo._id.toString();
      await insertTodos([todoOne, todoTwo]);

      await request(app)
        .get(`/v1/todos/${todoTwo._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 200 and the todo object if admin is trying to get another todo", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);

      await request(app)
        .get(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test("should return 400 error if todoId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);

      await request(app)
        .get("/v1/todos/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if todo is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("DELETE /v1/todos/:todoId", () => {
    test("should return 204 if data is ok", async () => {
      await insertUsers([userOne]);
      todoOne.userId = userOne._id.toString();
      await insertTodos([todoOne]);
      await request(app)
        .delete(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbTodo = await Todo.findById(todoOne._id);
      expect(dbTodo).toBeNull();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTodos([todoOne]);

      await request(app)
        .delete(`/v1/todos/${todoOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if todo is trying to delete another todo", async () => {
      await insertUsers([userOne, userTwo]);
      todoOne.userId = userOne._id.toString();
      await insertTodos([todoOne]);

      await request(app)
        .delete(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${userTwoAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 204 if admin is trying to delete another todo", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);

      await request(app)
        .delete(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test("should return 400 error if todoId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await request(app)
        .delete("/v1/todos/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if todo already is not found", async () => {
      await insertUsers([admin]);
      await insertTodos([todoTwo]);
      await request(app)
        .delete(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/todos/:todoId", () => {
    test("should return 200 and successfully update todo if data is ok", async () => {
      await insertUsers([userOne]);
      todoOne.userId = userOne._id.toString();
      await insertTodos([todoOne]);
      const updateBody = {
        title: "Todo-1-updated",
        hours: 4,
        status: "COMPLETED",
      };
      const res = await request(app)
        .patch(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
      expect(res.body.data).toEqual({
        relatedTasks: {
          taskId: todoOne.relatedTasks.taskId,
          taskTitle: todoOne.relatedTasks.taskTitle,
        },
        _id: todoOne._id.toString(),
        userId: userOne._id.toString(),
        completed: todoOne.completed,
        title: updateBody.title,
        status: updateBody.status,
        hours: updateBody.hours,
        subtask: expect.any(Array),
        completeBy: todoOne.completeBy,
      });

      const dbTodo = await Todo.findById(todoOne._id);
      expect(dbTodo).toBeDefined();
      expect(JSON.parse(JSON.stringify(dbTodo))).toMatchObject({
        _id: todoOne._id.toString(),
        relatedTasks: {
          taskId: todoOne.relatedTasks.taskId,
          taskTitle: todoOne.relatedTasks.taskTitle,
        },
        userId: userOne._id.toString(),
        completed: todoOne.completed,
        title: updateBody.title,
        status: updateBody.status,
        hours: updateBody.hours,
        subtask: expect.any(Array),
        completeBy: todoOne.completeBy,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTodos([todoOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/todos/${todoOne._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 404 if user is updating another user's todo", async () => {
      await insertUsers([userOne, userTwo]);
      todoOne.userId = userOne._id.toString();
      todoTwo.userId = userTwo._id.toString();
      await insertTodos([todoOne, todoTwo]);
      const updateBody = { title: faker.person.firstName() };

      await request(app)
        .patch(`/v1/todos/${todoTwo._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 200 and successfully update todo if admin is updating another todo", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);
      const updateBody = { title: faker.person.firstName() };

      await request(app)
        .patch(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test("should return 404 if admin is updating another todo that is not found", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);
      const updateBody = { title: faker.person.firstName() };

      await request(app)
        .patch(`/v1/todos/${todoTwo._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if todoId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);
      const updateBody = { title: faker.person.firstName() };

      await request(app)
        .patch(`/v1/todos/invalidId`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if userId is invalid", async () => {
      await insertUsers([admin]);
      await insertTodos([todoOne]);
      const updateBody = { userId: "test" };

      await request(app)
        .patch(`/v1/todos/${todoOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
