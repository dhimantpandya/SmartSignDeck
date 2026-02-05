import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { Company } from "../models";
import successResponse from "../helpers/responses/successResponse";
import ApiError from "../utils/ApiError";

const createCompany = catchAsync(async (req: Request, res: Response) => {
    const { User } = await import("../models"); // Dynamic import to avoid cycles if any

    // 1. Create Company
    const company = await Company.create({
        ...req.body,
        ownerId: (req.user as any).id
    });

    // 2. Link User to Company and make them Admin
    await User.findByIdAndUpdate((req.user as any).id, {
        companyId: company.id,
        companyName: company.name,
        role: "admin",
        onboardingCompleted: true
    });

    successResponse(res, "Company created", httpStatus.CREATED, company);
});

const getCompanies = catchAsync(async (req: Request, res: Response) => {
    const companies = await Company.find();
    successResponse(res, "Retrieved companies", httpStatus.OK, companies);
});

const getCompany = catchAsync(async (req: Request, res: Response) => {
    const company = await Company.findById(req.params.companyId);
    if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
    successResponse(res, "Retrieved company", httpStatus.OK, company);
});

const updateCompany = catchAsync(async (req: Request, res: Response) => {
    const company = await Company.findByIdAndUpdate(req.params.companyId, req.body, { new: true });
    if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
    successResponse(res, "Company updated", httpStatus.OK, company);
});

const deleteCompany = catchAsync(async (req: Request, res: Response) => {
    const company = await Company.findByIdAndDelete(req.params.companyId);
    if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
    successResponse(res, "Company deleted", httpStatus.OK);
});

export default {
    createCompany,
    getCompanies,
    getCompany,
    updateCompany,
    deleteCompany,
};
