import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import Template from "../../src/models/template.model";

export const templateOne = {
  _id: new mongoose.Types.ObjectId(),
  name: faker.commerce.productName(),
  resolution: "1920x1080",
  zones: [
    {
      id: "zone-1",
      type: "video",
      x: 0,
      y: 0,
      width: 1920,
      height: 540,
    },
    {
      id: "zone-2",
      type: "image",
      x: 0,
      y: 540,
      width: 1920,
      height: 540,
    },
  ],
  isActive: true,
};

export const templateTwo = {
  _id: new mongoose.Types.ObjectId(),
  name: faker.commerce.productName(),
  resolution: "1080x1920",
  zones: [
    {
      id: "zone-a",
      type: "mixed",
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
    },
  ],
  isActive: true,
};

export const insertTemplates = async (templates: any[]) => {
  await Template.insertMany(templates.map((template) => ({ ...template })));
};
