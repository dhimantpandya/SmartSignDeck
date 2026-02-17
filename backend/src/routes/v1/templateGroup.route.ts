import express, { type Router } from "express";
import auth from "../../middlewares/auth";
import templateGroupController from "../../controllers/templateGroup.controller";

const router: Router = express.Router();

router
    .route("/")
    .post(auth(), templateGroupController.createTemplateGroup)
    .get(auth(), templateGroupController.getTemplateGroups);

router
    .route("/:groupId")
    .get(auth(), templateGroupController.getTemplateGroup)
    .patch(auth(), templateGroupController.updateTemplateGroup)
    .delete(auth(), templateGroupController.deleteTemplateGroup);

router
    .route("/:groupId/templates")
    .post(auth(), templateGroupController.addTemplatesToGroup);

export default router;
