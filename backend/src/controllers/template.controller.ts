import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import templateService from "../services/template.service";
import screenService from "../services/screen.service";
import { emitToScreen } from "../services/socket.service";
import mongoose from "mongoose";
import { getIO } from "../services/socket.service";

const createTemplate = catchAsync(async (req: Request, res: Response) => {
    const template = await templateService.createTemplate(req.body, req.user as any);
    const io = getIO();
    if (io) {
        io.emit('template_published', { templateId: template._id });
    }
    successResponse(
        res,
        "Template created successfully",
        httpStatus.CREATED,
        template,
    );
});

const getTemplates = catchAsync(async (req: Request, res: Response) => {
    const filter: any = pick(req.query, ["name", "createdBy", "isPublic", "trashed", "collaborators"]);

    // Handle boolean strings
    if (filter.isPublic === 'true') filter.isPublic = true;
    if (filter.isPublic === 'false') filter.isPublic = false;
    if (filter.trashed === 'true') filter.trashed = true;
    if (filter.trashed === 'false') filter.trashed = false;

    // Explicit ObjectId casting for filters
    if (filter.createdBy && mongoose.Types.ObjectId.isValid(filter.createdBy)) {
        filter.createdBy = new mongoose.Types.ObjectId(filter.createdBy);
    }
    if (filter.collaborators && mongoose.Types.ObjectId.isValid(filter.collaborators)) {
        filter.collaborators = new mongoose.Types.ObjectId(filter.collaborators);
    }
    console.log('[TEMPLATE_CONTROLLER] Filter:', JSON.stringify(filter, null, 2));

    const options = pick(req.query, ["sortBy", "limit", "page"]);
    const result = await templateService.queryTemplates(filter, options, req.user as any);

    successResponse(
        res,
        "Templates retrieved successfully",
        httpStatus.OK,
        result as any,
    );
});

const getTemplate = catchAsync(async (req: Request, res: Response) => {
    const template = await templateService.getTemplateById(req.params.templateId, req.user as any);
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
    }

    successResponse(
        res,
        "Template retrieved successfully",
        httpStatus.OK,
        template as any,
    );
});

const updateTemplate = catchAsync(async (req: Request, res: Response) => {
    const template = await templateService.updateTemplateById(
        req.params.templateId,
        req.body,
        req.user as any
    );
    successResponse(
        res,
        "Template updated successfully",
        httpStatus.OK,
        template as any,
    );

    // Notify screens using this template
    const screens = await screenService.getScreensByTemplateId(req.params.templateId);
    screens.forEach((screen: any) => {
        emitToScreen(screen._id.toString(), "content_update", {
            reason: "template_updated",
            templateId: req.params.templateId,
        });
    });
});

const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
    await templateService.deleteTemplateById(req.params.templateId, req.user as any);
    res.status(httpStatus.NO_CONTENT).send();
});

const restoreTemplate = catchAsync(async (req: Request, res: Response) => {
    const template = await templateService.restoreTemplateById(req.params.templateId, req.user as any);
    successResponse(res, "Template restored successfully", httpStatus.OK, template as any);
});

const permanentDeleteTemplate = catchAsync(async (req: Request, res: Response) => {
    await templateService.permanentDeleteTemplateById(req.params.templateId, req.user as any);
    res.status(httpStatus.NO_CONTENT).send();
});

const bulkDeleteTemplates = catchAsync(async (req: Request, res: Response) => {
    const result = await templateService.deleteTemplatesByIds(req.body.ids, req.user as any);
    successResponse(
        res,
        "Templates processed for deletion",
        httpStatus.OK,
        result,
    );
});

const cloneTemplate = catchAsync(async (req: Request, res: Response) => {
    const template = await templateService.cloneTemplate(req.params.templateId, req.user as any);
    successResponse(
        res,
        "Template cloned successfully",
        httpStatus.CREATED,
        template as any,
    );
});

const bootstrapFromInspiration = catchAsync(async (req: Request, res: Response) => {
    const group = await templateService.bootstrapFromInspiration(req.body.name, req.user as any);
    successResponse(
        res,
        "Template group created from inspiration",
        httpStatus.CREATED,
        group as any,
    );
});

export default {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    bulkDeleteTemplates,
    restoreTemplate,
    permanentDeleteTemplate,
    cloneTemplate,
    bootstrapFromInspiration,
};
