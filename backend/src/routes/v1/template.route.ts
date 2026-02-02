import express from "express";
import validate from "../../middleware/validate";
import templateValidation from "../../validations/template.validation";
import templateController from "../../controllers/template.controller";

import auth from "../../middleware/auth";

const router = express.Router();

router
  .route("/")
  .post(
    auth("manageTemplates"),
    validate(templateValidation.createTemplate),
    templateController.createTemplate,
  )
  .get(
    auth("getTemplates"),
    validate(templateValidation.getTemplates),
    templateController.getTemplates,
  );

router
  .route("/:templateId")
  .get(
    auth("getTemplates"),
    validate(templateValidation.getTemplate),
    templateController.getTemplate,
  )
  .patch(
    auth("manageTemplates"),
    validate(templateValidation.updateTemplate),
    templateController.updateTemplate,
  )
  .delete(
    auth("manageTemplates"),
    validate(templateValidation.deleteTemplate),
    templateController.deleteTemplate,
  );

export default router;

router
  .route("/:templateId/restore")
  .post(
    auth("manageTemplates"),
    validate(templateValidation.getTemplate), // Reuse ID validation
    templateController.restoreTemplate
  );

router
  .route("/:templateId/permanent")
  .delete(
    auth("manageTemplates"),
    validate(templateValidation.deleteTemplate),
    templateController.permanentDeleteTemplate
  );
