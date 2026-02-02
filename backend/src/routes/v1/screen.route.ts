import express from "express";
import validate from "../../middleware/validate";
import screenValidation from "../../validations/screen.validation";
import screenController from "../../controllers/screen.controller";

import auth from "../../middleware/auth";

const router = express.Router();

router
  .route("/")
  .post(
    auth("manageScreens"),
    validate(screenValidation.createScreen),
    screenController.createScreen,
  )
  .get(
    auth("getScreens"),
    validate(screenValidation.getScreens),
    screenController.getScreens,
  );

router
  .route("/:screenId")
  .get(
    auth("getScreens"),
    validate(screenValidation.getScreen),
    screenController.getScreen,
  )
  .put(
    auth("manageScreens"),
    validate(screenValidation.updateScreen),
    screenController.updateScreen,
  )
  .patch(
    auth("manageScreens"),
    validate(screenValidation.updateScreen),
    screenController.updateScreen,
  )
  .delete(
    auth("manageScreens"),
    validate(screenValidation.deleteScreen),
    screenController.deleteScreen,
  );

router.post("/:screenId/ping", screenController.pingScreen);
router.route("/:screenId/refresh").post(auth("admin"), screenController.refreshScreen);

router
  .route("/:screenId/restore")
  .post(
    auth("manageScreens"),
    validate(screenValidation.getScreen),
    screenController.restoreScreen
  );

router
  .route("/:screenId/permanent")
  .delete(
    auth("manageScreens"),
    validate(screenValidation.deleteScreen),
    screenController.permanentDeleteScreen
  );

export default router;
