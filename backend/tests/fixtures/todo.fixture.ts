import mongoose, { type Types } from "mongoose";
import Todo from "../../src/models/todo.model";

interface Subtask {
  title: string;
  description: string;
}

interface RelatedTasks {
  taskId: string;
  taskTitle: string;
}

interface TodoData {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  completed: boolean;
  hours: number;
  subtask: Subtask[];
  relatedTasks: RelatedTasks;
  completeBy: string;
  status: string;
}

const todoOne: TodoData = {
  _id: new mongoose.Types.ObjectId(),
  userId: "63c0ea83fa8bc025ea0ed91c",
  title: "Todo-1",
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
    taskTitle: "Todo-1 ",
  },
  completeBy: "2023-10-24T18:05:47.000Z",
  status: "PENDING",
};

const todoTwo: TodoData = {
  _id: new mongoose.Types.ObjectId(),
  userId: "63c0ea83fa8bc025ea0ed91c",
  title: "Todo-2",
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
    taskTitle: "Todo-1 ",
  },
  completeBy: "2023-10-24T18:05:47.000Z",
  status: "PENDING",
};

const todoThree: TodoData = {
  _id: new mongoose.Types.ObjectId(),
  userId: "63c0ea83fa8bc025ea0ed91c",
  title: "Todo-3",
  completed: false,
  hours: 4,
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
    taskTitle: "Todo-1 ",
  },
  completeBy: "2023-10-24T18:05:47.000Z",
  status: "COMPLETED",
};

const insertTodos = async (todos: TodoData[]): Promise<void> => {
  await Todo.insertMany(todos);
};

export { insertTodos, todoOne, todoThree, todoTwo };
