/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */

import {
  type Document,
  type FilterQuery,
  type QueryOptions,
  type Schema,
} from "mongoose";

export interface CustomPaginateResult<T> {
  results: T[];
  skip: number;
  limit: number;
  totalResults: number;
}

export interface CustomPaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, any>;
  skip?: number;
  customLabels?: Record<string, any>;
  populate?: any;
  select?: Record<string, number>;

  // Include other options as needed
}

function paginate<T extends Document>(schema: Schema<T>): void {
  schema.statics.paginate = async function (
    filter: FilterQuery<T>,
    options: QueryOptions & {
      limit?: number | string;
      skip?: number | string;
      populate?: any;
      select?: any;
    },
  ): Promise<CustomPaginateResult<T>> {
    const limit =
      options.limit !== undefined && parseInt(options.limit.toString(), 10) > 0
        ? parseInt(options.limit.toString(), 10)
        : 10;
    const skip =
      options.skip !== undefined && parseInt(options.skip.toString(), 10) > 0
        ? parseInt(options.skip.toString(), 10)
        : 0;

    const countPromise: Promise<number> = this.countDocuments(filter).exec();

    let sort = "";
    if (options.sortBy) {
      const sortingCriteria: any = [];
      options.sortBy.split(",").forEach((sortOption: string) => {
        const [key, order] = sortOption.split(":");
        sortingCriteria.push((order === "desc" ? "-" : "") + key);
      });
      sort = sortingCriteria.join(" ");
    } else {
      sort = "-created_at";
    }

    let docsQuery = this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (options.populate !== undefined && options.populate !== null) {
      docsQuery = docsQuery.populate(options.populate);
    }
    if (options.select !== undefined && options.select !== null) {
      docsQuery = docsQuery.select(options.select);
    }

    const docsPromise = docsQuery.exec();

    const [totalResults, results] = await Promise.all([
      countPromise,
      docsPromise,
    ]);
    return {
      results,
      skip,
      limit,
      totalResults,
    };
  };
}

export default paginate;
