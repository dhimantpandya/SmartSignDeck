import mongoose from "mongoose";
import config from "../../src/config/config";

const setupTestDB = (): void => {
  beforeAll(async (): Promise<void> => {
    await mongoose.connect(
      config.mongoose.url,
      config.mongoose.options as mongoose.ConnectOptions,
    );
  });

  beforeEach(async (): Promise<void> => {
    await Promise.all(
      (await mongoose.connection.db.collections()).map(
        async (collection): Promise<void> => {
          await collection.deleteMany({});
        },
      ),
    );
  });

  afterAll(async (): Promise<void> => {
    await mongoose.disconnect();
  });
};

export default setupTestDB;
