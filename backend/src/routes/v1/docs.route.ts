/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from "express";
import basicAuth from "express-basic-auth";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import config from "../../config/config";
import swaggerDefinition from "../../docs/swaggerDef";

const router: Router = express.Router();

const authMiddleware = basicAuth({
  users: { [config.apiDoc.userName]: config.apiDoc.password },
  challenge: true,
  realm: "Imb4T3st4pp",
});

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ["src/docs/*.yml", "src/routes/v1/*.ts"],
});

router.use("/", authMiddleware, swaggerUi.serve);
router.get(
  "/",
  swaggerUi.setup(specs, {
    explorer: true,
  }),
);

export default router;
