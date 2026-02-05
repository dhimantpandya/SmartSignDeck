import express from "express";
import auth from "../../middleware/auth";
import companyController from "../../controllers/company.controller";

const router = express.Router();

router
    .route("/")
    .post(auth(), companyController.createCompany)
    .get(auth("manageAllCompanies"), companyController.getCompanies);

router
    .route("/:companyId")
    .get(auth("manageCompany"), companyController.getCompany)
    .patch(auth("manageAllCompanies"), companyController.updateCompany)
    .delete(auth("manageAllCompanies"), companyController.deleteCompany);

export default router;
