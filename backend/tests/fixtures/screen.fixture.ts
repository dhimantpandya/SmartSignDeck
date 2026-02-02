import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import Screen from "../../src/models/screen.model";
import { templateOne } from "./template.fixture";

export const screenOne = {
  _id: new mongoose.Types.ObjectId(),
  name: faker.commerce.productName(),
  location: faker.location.city(),
  templateId: templateOne._id,
  status: "offline",
  lastPing: new Date(),
};

export const screenTwo = {
  _id: new mongoose.Types.ObjectId(),
  name: faker.commerce.productName(),
  location: faker.location.city(),
  templateId: templateOne._id,
  status: "online",
  lastPing: new Date(),
};

export const insertScreens = async (screens: any[]) => {
  await Screen.insertMany(screens.map((screen) => ({ ...screen })));
};
