"use strict";
/* eslint-disable @typescript-eslint/restrict-template-expressions */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const plugins_1 = require("../../../../src/models/plugins/");
const setupTestDB_1 = __importDefault(require("../../../utils/setupTestDB"));
// const toJSON = require('../../../../src/models/plugins/toJSON.plugin');
const { ObjectId } = mongoose_1.default.Types;
const projectSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    milestones: {
        type: Number,
        default: 1,
    },
});
projectSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project',
});
projectSchema.plugin(plugins_1.paginate);
projectSchema.plugin(plugins_1.toJSON);
const Project = mongoose_1.default.model('Project', projectSchema);
const taskSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    project: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: 'Project',
        required: true,
    },
});
taskSchema.plugin(plugins_1.paginate);
taskSchema.plugin(plugins_1.toJSON);
const Task = mongoose_1.default.model('Task', taskSchema);
(0, setupTestDB_1.default)();
describe('paginate plugin', () => {
    describe('populate option', () => {
        test('should populate the specified data fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const project = yield Project.create({ name: 'Project One' });
            const task = yield Task.create({ name: 'Task One', project: project._id });
            const taskPages = yield Task.paginate({ _id: task._id }, { populate: 'project' });
            expect(taskPages.results[0]).toMatchObject({ project: { _id: project._id, name: project.name } });
        }));
    });
    describe('sort option', () => {
        test('should sort results in ascending order using created_at by default', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectOne = yield Project.create({ name: 'Project One' });
            const projectTwo = yield Project.create({ name: 'Project Two' });
            const projectThree = yield Project.create({ name: 'Project Three' });
            const projectPages = yield Project.paginate({}, {});
            expect(projectPages.results).toHaveLength(3);
            expect(projectPages.results[0]).toMatchObject({ name: projectOne.name });
            expect(projectPages.results[1]).toMatchObject({ name: projectTwo.name });
            expect(projectPages.results[2]).toMatchObject({ name: projectThree.name });
        }));
        test('should sort results in ascending order if ascending sort param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectOne = yield Project.create({ name: 'Project One' });
            const projectTwo = yield Project.create({ name: 'Project Two', milestones: 2 });
            const projectThree = yield Project.create({ name: 'Project Three', milestones: 3 });
            const projectPages = yield Project.paginate({}, { sort: { milestones: 1 } });
            expect(projectPages.results).toHaveLength(3);
            expect(projectPages.results[0]).toMatchObject({ name: projectOne.name });
            expect(projectPages.results[1]).toMatchObject({ name: projectTwo.name });
            expect(projectPages.results[2]).toMatchObject({ name: projectThree.name });
        }));
        test('should sort results in descending order if descending sort param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectOne = yield Project.create({ name: 'Project One' });
            const projectTwo = yield Project.create({ name: 'Project Two', milestones: 2 });
            const projectThree = yield Project.create({ name: 'Project Three', milestones: 3 });
            const projectPages = yield Project.paginate({}, { sort: { milestones: -1 } });
            expect(projectPages.results).toHaveLength(3);
            expect(projectPages.results[0]).toMatchObject({ name: projectThree.name });
            expect(projectPages.results[1]).toMatchObject({ name: projectTwo.name });
            expect(projectPages.results[2]).toMatchObject({ name: projectOne.name });
        }));
    });
    describe('limit option', () => {
        const projects = [
            { name: 'Project One', milestones: 1 },
            { name: 'Project Two', milestones: 2 },
            { name: 'Project Three', milestones: 3 },
        ];
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield Project.insertMany(projects);
        }));
        test('should limit returned results if limit param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { limit: 2 });
            expect(projectPages.results).toHaveLength(2);
            expect(projectPages.results[0]).toMatchObject({ name: 'Project One' });
            expect(projectPages.results[1]).toMatchObject({ name: 'Project Two' });
        }));
    });
    describe('page option', () => {
        const projects = [
            { name: 'Project One', milestones: 1 },
            { name: 'Project Two', milestones: 2 },
            { name: 'Project Three', milestones: 3 },
        ];
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield Project.insertMany(projects);
        }));
        test('should return the correct page if page and limit params are specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { limit: 2, skip: 2 });
            expect(projectPages.results).toHaveLength(1);
            expect(projectPages.results[0]).toMatchObject({ name: 'Project Three' });
        }));
    });
    describe('select option', () => {
        const projects = [
            { name: 'Project One', milestones: 1 },
            { name: 'Project Two', milestones: 2 },
            { name: 'Project Three', milestones: 3 },
        ];
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield Project.insertMany(projects);
        }));
        test('should exclude a field when the hide param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { select: { milestones: 0 } });
            expect(projectPages.results[0]).not.toMatchObject({ milestones: expect.any(Number) });
        }));
        test('should exclude multiple fields when the hide param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { select: { milestones: 0, name: 0 } });
            expect(projectPages.results[0]).not.toMatchObject({ milestones: expect.any(Number), name: expect.any(String) });
        }));
        test('should include a field when the include param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { select: { milestones: 1 } });
            expect(projectPages.results[0]).not.toMatchObject({ name: expect.any(String) });
            expect(projectPages.results[0]).toMatchObject({ milestones: expect.any(Number) });
        }));
        test('should include multiple fields when the include param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { select: { milestones: 1, name: 1 } });
            expect(projectPages.results[0]).toHaveProperty('milestones');
            expect(projectPages.results[0]).toHaveProperty('name');
        }));
        test('should always include id when the include param is specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const projectPages = yield Project.paginate({}, { select: { milestones: 1 } });
            expect(projectPages.results[0]).not.toMatchObject({ name: expect.any(String) });
            expect(projectPages.results[0]).toMatchObject({ _id: expect.any(ObjectId), milestones: expect.any(Number) });
        }));
    });
});
