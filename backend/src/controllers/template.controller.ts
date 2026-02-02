import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import templateService from "../services/template.service";
import screenService from "../services/screen.service";
import { emitToScreen } from "../services/socket.service";

const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = await templateService.createTemplate(req.body, req.user as any);
  successResponse(
    res,
    "Template created successfully",
    httpStatus.CREATED,
    template,
  );
});

const getTemplates = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ["name"]);
  if ((req.query.trashed as any) === true || req.query.trashed === 'true') {
    // @ts-ignore
    filter.deletedAt = { $ne: null };
  }
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await templateService.queryTemplates(filter, options, req.user as any);
  successResponse(
    res,
    "Templates retrieved successfully",
    httpStatus.OK,
    result,
  );
});

const getTemplate = catchAsync(async (req: Request, res: Response) => {
  const template = await templateService.getTemplateById(req.params.templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }

  // Permission check for single retrieval
  const user: any = req.user;
  if (user.role !== "super_admin" && !template.isPublic && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
  }

  successResponse(
    res,
    "Template retrieved successfully",
    httpStatus.OK,
    template,
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
    template,
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
  successResponse(res, "Template restored successfully", httpStatus.OK, template);
});

const permanentDeleteTemplate = catchAsync(async (req: Request, res: Response) => {
  await templateService.permanentDeleteTemplateById(req.params.templateId, req.user as any);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  restoreTemplate,
  permanentDeleteTemplate,
};
