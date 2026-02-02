/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */

/**
 * A mongoose schema plugin which applies the following in the toJSON transform call:
 *  - removes __v, created_at, updated_at, and any path that has private: true
 *  - replaces _id with id
 */

export interface MongooseSchema {
  options: {
    toJSON?: {
      transform?: (doc: any, ret: any, options: any) => any;
    };
  };
  paths: Record<
    string,
    {
      options: {
        private?: boolean;
      };
    }
  >;
}

const deleteAtPath = (obj: any, path: string[], index: number): void => {
  if (index === path.length - 1) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

const toJSON: any = (schema: MongooseSchema): void => {
  let transform: (doc: any, ret: any, options: any) => any;
  if (schema.options.toJSON?.transform != null) {
    transform = schema.options.toJSON.transform;
  }

  schema.options.toJSON = Object.assign(schema.options.toJSON ?? {}, {
    transform(doc: any, ret: any, options: any) {
      Object.keys(schema.paths).forEach((path) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (schema.paths[path].options && schema.paths[path].options.private) {
          deleteAtPath(ret, path.split("."), 0);
        }
      });

      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      // Keep created_at and updated_at for frontend use
      // delete ret.created_at;
      // delete ret.updated_at;
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (transform) {
        return transform(doc, ret, options);
      }
    },
  });
};

export default toJSON;
