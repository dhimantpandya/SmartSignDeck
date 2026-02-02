import { version } from "../../package.json";
import config from "../config/config";

interface SwaggerDef {
  openapi: string;
  info: {
    title: string;
    version: string;
    license: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
  }>;
}

const swaggerDef: SwaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "API documentation",
    version,
    license: {
      name: "MIT",
      url: "https://github.com/chintanshahts/node-express-mongo-boilerplate/blob/main/LICENSE",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
    },
  ],
};

export default swaggerDef;
