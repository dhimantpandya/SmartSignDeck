import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import { templateGroupService } from "../services";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";

const createTemplateGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.createTemplateGroup({
        ...req.body,
        createdBy: req.user.id,
        companyId: req.user.companyId,
    });
    res.status(httpStatus.CREATED).send(group);
});

const getTemplateGroups = catchAsync(async (req, res) => {
    const filter = pick(req.query, ["name", "createdBy", "companyId"]);
    const options = pick(req.query, ["sortBy", "limit", "page"]);

    // Ensure users only see groups from their company
    filter.companyId = req.user.companyId;

    const result = await templateGroupService.queryTemplateGroups(filter, options);
    res.send(result);
});

const getTemplateGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.getTemplateGroupById(req.params.groupId);
    if (!group || group.companyId.toString() !== req.user.companyId.toString()) {
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
    res.status(httpStatus.NO_CONTENT).send();
});

const addTemplatesToGroup = catchAsync(async (req, res) => {
    const group = await templateGroupService.addTemplatesToGroup(req.params.groupId, req.body.templateIds);
    res.send(group);
});

export default {
    createTemplateGroup,
    getTemplateGroups,
    getTemplateGroup,
    updateTemplateGroup,
    deleteTemplateGroup,
    addTemplatesToGroup
};
