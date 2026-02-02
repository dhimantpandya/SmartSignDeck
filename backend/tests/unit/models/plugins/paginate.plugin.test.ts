/* eslint-disable @typescript-eslint/restrict-template-expressions */

import mongoose, {
  type Document,
  type Model,
  type FilterQuery,
} from "mongoose";
import {
  type CustomPaginateOptions,
  type CustomPaginateResult,
} from "../../../../src/models/plugins/paginate.plugin";

import { paginate, toJSON } from "../../../../src/models/plugins/";
import setupTestDB from "../../../utils/setupTestDB";
// const toJSON = require('../../../../src/models/plugins/toJSON.plugin');

const { ObjectId } = mongoose.Types;

interface IProject extends Document {
  name: string;
  milestones: number;
}

export interface IProjectModel extends Model<IProject> {
  paginate: (
    filter: FilterQuery<IProject>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<IProject>>; // Ensure this matches your plugin's signature
}

const projectSchema = new mongoose.Schema<IProject, IProjectModel>({
  name: {
    type: String,
    required: true,
  },
  milestones: {
    type: Number,
    default: 1,
  },
});

projectSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
});

projectSchema.plugin(paginate);
projectSchema.plugin(toJSON);

const Project = mongoose.model<IProject, IProjectModel>(
  "Project",
  projectSchema,
);

interface ITask extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
}

export interface ITaskModel extends Model<ITask> {
  paginate: (
    filter: FilterQuery<ITask>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<ITask>>; // Ensure this matches your plugin's signature
}

const taskSchema = new mongoose.Schema<ITask, ITaskModel>({
  name: {
    type: String,
    required: true,
  },
  project: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Project",
    required: true,
  },
});

taskSchema.plugin(paginate);
taskSchema.plugin(toJSON);

const Task = mongoose.model<ITask, ITaskModel>("Task", taskSchema);

setupTestDB();

describe("paginate plugin", () => {
  describe("populate option", () => {
    test("should populate the specified data fields", async () => {
      const project = await Project.create({ name: "Project One" });
      const task = await Task.create({
        name: "Task One",
        project: project._id,
      });

      const taskPages = await Task.paginate(
        { _id: task._id },
        { populate: "project" },
      );
      expect(taskPages.results[0]).toMatchObject({
        project: { _id: project._id, name: project.name },
      });
    });
  });

  describe("sort option", () => {
    test("should sort results in ascending order using created_at by default", async () => {
      const projectOne = await Project.create({ name: "Project One" });
      const projectTwo = await Project.create({ name: "Project Two" });
      const projectThree = await Project.create({ name: "Project Three" });

      const projectPages = await Project.paginate({}, {});

      expect(projectPages.results).toHaveLength(3);
      expect(projectPages.results[0]).toMatchObject({ name: projectOne.name });
      expect(projectPages.results[1]).toMatchObject({ name: projectTwo.name });
      expect(projectPages.results[2]).toMatchObject({
        name: projectThree.name,
      });
    });

    test("should sort results in ascending order if ascending sort param is specified", async () => {
      const projectOne = await Project.create({ name: "Project One" });
      const projectTwo = await Project.create({
        name: "Project Two",
        milestones: 2,
      });
      const projectThree = await Project.create({
        name: "Project Three",
        milestones: 3,
      });

      const projectPages = await Project.paginate(
        {},
        { sort: { milestones: 1 } },
      );

      expect(projectPages.results).toHaveLength(3);
      expect(projectPages.results[0]).toMatchObject({ name: projectOne.name });
      expect(projectPages.results[1]).toMatchObject({ name: projectTwo.name });
      expect(projectPages.results[2]).toMatchObject({
        name: projectThree.name,
      });
    });

    test("should sort results in descending order if descending sort param is specified", async () => {
      const projectOne = await Project.create({ name: "Project One" });
      const projectTwo = await Project.create({
        name: "Project Two",
        milestones: 2,
      });
      const projectThree = await Project.create({
        name: "Project Three",
        milestones: 3,
      });

      const projectPages = await Project.paginate(
        {},
        { sort: { milestones: -1 } },
      );

      expect(projectPages.results).toHaveLength(3);
      expect(projectPages.results[0]).toMatchObject({
        name: projectThree.name,
      });
      expect(projectPages.results[1]).toMatchObject({ name: projectTwo.name });
      expect(projectPages.results[2]).toMatchObject({ name: projectOne.name });
    });
  });

  describe("limit option", () => {
    const projects = [
      { name: "Project One", milestones: 1 },
      { name: "Project Two", milestones: 2 },
      { name: "Project Three", milestones: 3 },
    ];
    beforeEach(async () => {
      await Project.insertMany(projects);
    });

    test("should limit returned results if limit param is specified", async () => {
      const projectPages = await Project.paginate({}, { limit: 2 });

      expect(projectPages.results).toHaveLength(2);
      expect(projectPages.results[0]).toMatchObject({ name: "Project One" });
      expect(projectPages.results[1]).toMatchObject({ name: "Project Two" });
    });
  });

  describe("page option", () => {
    const projects = [
      { name: "Project One", milestones: 1 },
      { name: "Project Two", milestones: 2 },
      { name: "Project Three", milestones: 3 },
    ];
    beforeEach(async () => {
      await Project.insertMany(projects);
    });

    test("should return the correct page if page and limit params are specified", async () => {
      const projectPages = await Project.paginate({}, { limit: 2, skip: 2 });
      expect(projectPages.results).toHaveLength(1);
      expect(projectPages.results[0]).toMatchObject({ name: "Project Three" });
    });
  });

  describe("select option", () => {
    const projects = [
      { name: "Project One", milestones: 1 },
      { name: "Project Two", milestones: 2 },
      { name: "Project Three", milestones: 3 },
    ];
    beforeEach(async () => {
      await Project.insertMany(projects);
    });

    test("should exclude a field when the hide param is specified", async () => {
      const projectPages = await Project.paginate(
        {},
        { select: { milestones: 0 } },
      );

      expect(projectPages.results[0]).not.toMatchObject({
        milestones: expect.any(Number),
      });
    });

    test("should exclude multiple fields when the hide param is specified", async () => {
      const projectPages = await Project.paginate(
        {},
        { select: { milestones: 0, name: 0 } },
      );

      expect(projectPages.results[0]).not.toMatchObject({
        milestones: expect.any(Number),
        name: expect.any(String),
      });
    });

    test("should include a field when the include param is specified", async () => {
      const projectPages = await Project.paginate(
        {},
        { select: { milestones: 1 } },
      );

      expect(projectPages.results[0]).not.toMatchObject({
        name: expect.any(String),
      });
      expect(projectPages.results[0]).toMatchObject({
        milestones: expect.any(Number),
      });
    });

    test("should include multiple fields when the include param is specified", async () => {
      const projectPages = await Project.paginate(
        {},
        { select: { milestones: 1, name: 1 } },
      );

      expect(projectPages.results[0]).toHaveProperty("milestones");
      expect(projectPages.results[0]).toHaveProperty("name");
    });

    test("should always include id when the include param is specified", async () => {
      const projectPages = await Project.paginate(
        {},
        { select: { milestones: 1 } },
      );
      expect(projectPages.results[0]).not.toMatchObject({
        name: expect.any(String),
      });
      expect(projectPages.results[0]).toMatchObject({
        _id: expect.any(ObjectId),
        milestones: expect.any(Number),
      });
    });
  });
});
