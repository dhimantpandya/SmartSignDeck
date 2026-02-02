/* eslint-disable @typescript-eslint/restrict-template-expressions */

import mongoose, {
  Schema,
  type Connection,
  type Document,
  type Model,
} from "mongoose";

interface PrivateDocument extends Document {
  private: string;
}

interface PublicDocument extends Document {
  public: string;
}
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const toJSON = (schema: Schema) => {
  schema.set("toJSON", {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    transform: (doc: Document, ret: any) => {
      delete ret.__v;
      delete ret.created_at;
      delete ret.updated_at;
      delete ret.private;
    },
  });
};

describe("toJSON plugin", () => {
  let connection: Connection;
  let Model: Model<PrivateDocument | PublicDocument>;

  beforeEach(() => {
    connection = mongoose.createConnection();
  });

  it("should remove __v", () => {
    const schema = new Schema({});
    toJSON(schema);
    Model = connection.model<PublicDocument>("Model", schema);
    const doc = new Model();
    expect(doc.toJSON()).not.toHaveProperty("__v");
  });

  it("should remove created_at and updated_at", () => {
    const schema = new Schema({}, { timestamps: true });
    toJSON(schema);
    Model = connection.model<PublicDocument>("Model", schema);
    const doc = new Model();
    expect(doc.toJSON()).not.toHaveProperty("created_at");
    expect(doc.toJSON()).not.toHaveProperty("updated_at");
  });

  it("should remove any path set as private", () => {
    const schema = new Schema({
      public: { type: String },
      private: { type: String, private: true },
    });
    toJSON(schema);
    Model = connection.model<PublicDocument>("Model", schema);
    const doc = new Model({
      public: "some public value",
      private: "some private value",
    });
    expect(doc.toJSON()).not.toHaveProperty("private");
    expect(doc.toJSON()).toHaveProperty("public");
  });

  // it('should remove any nested paths set as private', () => {
  //   const schema = new Schema({
  //     public: { type: String },
  //     nested: {
  //       private: { type: String, private: true },
  //     },
  //   });
  //   toJSON(schema);
  //   Model = connection.model<PublicDocument>('Model', schema);
  //   const doc = new Model({
  //     public: 'some public value',
  //     nested: {
  //       private: 'some nested private value',
  //     },
  //   });
  //   expect(doc.toJSON()).not.toHaveProperty('nested.private');
  //   expect(doc.toJSON()).toHaveProperty('public');
  // });

  it("should also call the schema toJSON transform function", () => {
    const schema = new Schema(
      {
        public: { type: String },
        private: { type: String },
      },
      {
        toJSON: {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          transform: (doc: Document, ret: any) => {
            delete ret.private;
          },
        },
      },
    );
    toJSON(schema);
    Model = connection.model<PublicDocument>("Model", schema);
    const doc = new Model({
      public: "some public value",
      private: "some private value",
    });
    expect(doc.toJSON()).not.toHaveProperty("private");
    expect(doc.toJSON()).toHaveProperty("public");
  });
});
