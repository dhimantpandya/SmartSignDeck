import { faker } from "@faker-js/faker";
import mongoose, { type Types } from "mongoose";

const password = "password1";

export interface UserFixture {
  _id: Types.ObjectId;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_email_verified: boolean;
  password: string;
}

export const userOne: UserFixture = {
  _id: new mongoose.Types.ObjectId(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  role: "user",
  is_email_verified: false,
  password,
};

export const userTwo: UserFixture = {
  _id: new mongoose.Types.ObjectId(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: "user",
  is_email_verified: false,
};

export const admin: UserFixture = {
  _id: new mongoose.Types.ObjectId(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: "admin",
  is_email_verified: false,
};
