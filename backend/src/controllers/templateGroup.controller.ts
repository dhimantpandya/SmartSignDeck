import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import { templateGroupService } from "../services";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";

const createTemplateGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.createTemplateGroup({
        ...req.body,
        createdBy: (req as any).user.id,
        companyId: (req as any).user.companyId,
    });
    res.status(httpStatus.CREATED).send(group);
});

const getTemplateGroups = catchAsync(async (req, res) => {
    const filter = pick(req.query, ["name", "createdBy", "companyId", "trashed"]);
    const options = pick(req.query, ["sortBy", "limit", "page"]);

    // Ensure users only see groups from their company
    filter.companyId = (req as any).user.companyId;

    const result = await templateGroupService.queryTemplateGroups(filter, options, (req as any).user);
    res.send(result);
});

const getTemplateGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.getTemplateGroupById(req.params.groupId);
    if (!group ||
        group.companyId.toString() !== (req as any).user.companyId.toString() ||
        group.deletedAt !== null) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }
    res.send(group);
});

const updateTemplateGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.updateTemplateGroupById(req.params.groupId, req.body);
    res.send(group);
});

const deleteTemplateGroup = catchAsync(async (req, res) => {
    await templateGroupService.deleteTemplateGroupById(req.params.groupId);
    res.status(httpStatus.OK).send({
        status: "success",
        message: "Template group moved to Recycle Bin"
    });
});

const restoreTemplateGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.restoreTemplateGroupById(req.params.groupId);
    res.send(group);
});

const permanentDeleteTemplateGroup = catchAsync(async (req, res) => {
    await templateGroupService.permanentDeleteTemplateGroupById(req.params.groupId);
    res.status(httpStatus.OK).send({
        status: "success",
        message: "Template group permanently deleted"
    });
});

const addTemplatesToGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.addTemplatesToGroup(req.params.groupId, req.body.templateIds);
    res.send(group);
});

const removeTemplatesFromGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.removeTemplatesFromGroup(req.params.groupId, req.body.templateIds);
    res.send(group);
});

export default {
    createTemplateGroup,
    getTemplateGroups,
    getTemplateGroup,
    updateTemplateGroup,
    deleteTemplateGroup,
    restoreTemplateGroup,
    permanentDeleteTemplateGroup,
    addTemplatesToGroup,
    removeTemplatesFromGroup
};
