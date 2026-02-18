import { type FilterQuery } from "mongoose";
import { escapeRegExp } from "./regex";

const createSearchFilter = <T>(
  fields: Array<keyof T>,
  searchTerm: string,
): FilterQuery<T> => {
  if (searchTerm === null || searchTerm === undefined || searchTerm === "")
    return {};

  const searchRegex = new RegExp(escapeRegExp(searchTerm), "i"); // Case-insensitive regex
  const orFilters = fields.map((field) => ({ [field]: searchRegex }));

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { $or: orFilters } as FilterQuery<T>;
};

export default createSearchFilter;
