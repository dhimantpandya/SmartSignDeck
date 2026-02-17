import express, { type Router } from "express";
import auth from "../../middleware/auth";
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

router.patch("/:groupId/restore", auth(), templateGroupController.restoreTemplateGroup);
router.delete("/:groupId/permanent", auth(), templateGroupController.permanentDeleteTemplateGroup);

router
    .route("/:groupId/templates")
    .post(auth(), templateGroupController.addTemplatesToGroup)
    .delete(auth(), templateGroupController.removeTemplatesFromGroup);

export default router;
