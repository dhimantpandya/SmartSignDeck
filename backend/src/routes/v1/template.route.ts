import express from "express";
import validate from "../../middleware/validate";
import templateValidation from "../../validations/template.validation";
import templateController from "../../controllers/template.controller";

import { bulkValidation } from "../../validations";
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
  .route("/bulk-delete")
  .post(
    auth("manageTemplates"),
    validate(bulkValidation.bulkDelete),
    templateController.bulkDeleteTemplates
  );

router
  .route("/bootstrap-from-inspiration")
  .post(
    auth("createTemplates"),
    templateController.bootstrapFromInspiration
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

router
  .route("/:templateId/clone")
  .post(
    auth("createTemplates"),
    templateController.cloneTemplate
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
