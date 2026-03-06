import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import Company from "../models/company.model";
import successResponse from "../helpers/responses/successResponse";
import ApiError from "../utils/ApiError";
import { getIO } from "../services/socket.service";
import User from "../models/user.model";

const createCompany = catchAsync(async (req: Request, res: Response) => {
    const User = (await import("../models/user.model")).default; // Dynamic import to avoid cycles if any

    // 1. Create Company
    const company = await Company.create({
        ...req.body,
        ownerId: (req.user as any).id
    });

    // 2. Link User to Company and complete onboarding
    await User.findByIdAndUpdate((req.user as any).id, {
        companyId: company.id,
        companyName: company.name,
        role: "user",
        onboardingCompleted: true
    });


    // Global broadcast
    try { getIO().emit('company_updated', company); } catch (e) { }

    successResponse(res, "Company created", httpStatus.CREATED, company);
});

const getCompanies = catchAsync(async (req: Request, res: Response) => {
    const companies = await Company.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "companyId",
                as: "members"
            }
        },
        {
            $project: {
                name: 1,
                ownerId: 1,
                description: 1,
                logo: 1,
                website: 1,
                isActive: 1,
                created_at: 1,
                updated_at: 1,
                memberCount: { $size: "$members" },
                id: "$_id"
            }
        }
    ]);
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

    // Global broadcast
    try { getIO().emit('company_updated', company); } catch (e) { }

    successResponse(res, "Company updated", httpStatus.OK, company);
});

const deleteCompany = catchAsync(async (req: Request, res: Response) => {
    const { password } = req.body;
    const currentUser = req.user as any;

    // 1. Verify Password
    const user = await User.findById(currentUser.id || currentUser._id);
    if (!user || !(await user.isPasswordMatch(password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password. Security protocol initiated.");
    }

    const companyId = req.params.companyId;
    const company = await Company.findById(companyId);
    if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

    // 2. Cascading Delete: Remove all users associated with this company
    await User.deleteMany({ companyId });

    // 3. Delete Company
    await company.deleteOne();

    // 4. Global broadcast
    try { getIO().emit('company_deleted', { id: companyId }); } catch (e) { }

    successResponse(res, "Company and all its employees deleted", httpStatus.OK);
});

export default {
    createCompany,
    getCompanies,
    getCompany,
    updateCompany,
    deleteCompany,
};
