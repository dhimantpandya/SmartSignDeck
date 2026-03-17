import httpStatus from "http-status";
import { TemplateGroup, Template } from "../models";
import ApiError from "../utils/ApiError";
import type { ITemplateGroup } from "../models/templateGroup.model";
import mongoose, { FilterQuery } from "mongoose";
import type { CustomPaginateOptions, CustomPaginateResult } from "../models/plugins/paginate.plugin";

/**
 * Create a template group
 * @param {Partial<ITemplateGroup>} groupBody
 * @returns {Promise<ITemplateGroup>}
 */
const createTemplateGroup = async (groupBody: Partial<ITemplateGroup>): Promise<ITemplateGroup> => {
    return TemplateGroup.create(groupBody);
};

/**
 * Query for template groups
 * @param {FilterQuery<ITemplateGroup>} filter - Mongo filter
 * @param {CustomPaginateOptions} options - Query options
 * @returns {Promise<CustomPaginateResult<ITemplateGroup>>}
 */
const queryTemplateGroups = async (
    filter: FilterQuery<ITemplateGroup>,
    options: CustomPaginateOptions,
): Promise<CustomPaginateResult<ITemplateGroup>> => {
    // If 'trashed' is specifically passed as true, we look for deleted items
    // Otherwise, we default to only non-deleted items
    const finalFilter: any = { ...filter };
    const user = (options as any).user;

    if (user && user.role !== "super_admin") {
        const userIdStr = (user.id || user._id || "").toString();
        // Strict Privacy: Only show groups created by the user, even for Admins
        if (userIdStr) {
            finalFilter.createdBy = userIdStr;
        }
    }

    if (filter.trashed === 'true') {
        const userId = user?._id || user?.id;
        finalFilter.deletedAt = { $ne: null };
        if (userId) {
            finalFilter.createdBy = userId;
        }
        delete finalFilter.trashed;
    } else {
        finalFilter.deletedAt = null;
    }

    const groups = await TemplateGroup.paginate(finalFilter, options);
    return groups;
};

/**
 * Get template group by id
 * @param {string} id
 * @returns {Promise<ITemplateGroup | null>}
 */
const getTemplateGroupById = async (id: string): Promise<ITemplateGroup | null> => {
    return TemplateGroup.findById(id).populate({
        path: 'templates',
        match: { deletedAt: null },
        populate: { path: 'createdBy' }
    });
};

/**
 * Update template group by id
 * @param {string} groupId
 * @param {Partial<ITemplateGroup>} updateBody
 * @returns {Promise<ITemplateGroup | null>}
 */
const updateTemplateGroupById = async (
    groupId: string,
    updateBody: Partial<ITemplateGroup>,
): Promise<ITemplateGroup | null> => {
    const group = await getTemplateGroupById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }
    Object.assign(group, updateBody);
    await group.save();
    return group;
};

/**
 * Delete template group by id
 * @param {string} groupId
 * @returns {Promise<ITemplateGroup | null>}
 */
const deleteTemplateGroupById = async (groupId: string): Promise<ITemplateGroup | null> => {
    const group = await getTemplateGroupById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }

    const now = new Date();
    group.deletedAt = now;
    await group.save();

    // Cascading delete: Trash all templates in this group
    if (group.templates && group.templates.length > 0) {
        // Ensure we use the IDs even if templates were populated
        const templateIds = group.templates.map(t => (t as any)._id || (t as any).id || t);
        await Template.updateMany(
            { _id: { $in: templateIds } },
            { $set: { deletedAt: now } }
        );
    }

    return group;
};

/**
 * Restore template group by id
 * @param {string} groupId
 * @returns {Promise<ITemplateGroup | null>}
 */
const restoreTemplateGroupById = async (groupId: string): Promise<ITemplateGroup | null> => {
    const group = await TemplateGroup.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }
    group.deletedAt = null;
    await group.save();
    return group;
};

/**
 * Permanent delete template group by id
 * @param {string} groupId
 * @returns {Promise<ITemplateGroup | null>}
 */
const permanentDeleteTemplateGroupById = async (groupId: string): Promise<ITemplateGroup | null> => {
    const group = await TemplateGroup.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }
    await group.deleteOne();
    return group;
};

/**
 * Add templates to group
 * @param {string} groupId
 * @param {string[]} templateIds
 * @returns {Promise<ITemplateGroup | null>}
 */
const addTemplatesToGroup = async (groupId: string, templateIds: string[]): Promise<ITemplateGroup | null> => {
    const group = await getTemplateGroupById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }

    const existingTemplates = group.templates.map(t => t.toString());
    const newTemplates = templateIds.filter(id => !existingTemplates.includes(id));

    if (newTemplates.length > 0) {
        group.templates.push(...(newTemplates.map(id => new mongoose.Types.ObjectId(id))));
        await group.save();
    }

    return group;
};

/**
 * Remove templates from group
 * @param {string} groupId
 * @param {string[]} templateIds
 * @returns {Promise<ITemplateGroup | null>}
 */
const removeTemplatesFromGroup = async (groupId: string, templateIds: string[]): Promise<ITemplateGroup | null> => {
    const group = await TemplateGroup.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template group not found");
    }

    const idsToRemove = templateIds.map(id => new mongoose.Types.ObjectId(id));
    // @ts-ignore
    group.templates = group.templates.filter(t => !templateIds.includes(t.toString()) && !templateIds.includes(t._id?.toString()));

    await group.save();
    return group;
};

export default {
    createTemplateGroup,
    queryTemplateGroups,
    getTemplateGroupById,
    updateTemplateGroupById,
    deleteTemplateGroupById,
    restoreTemplateGroupById,
    permanentDeleteTemplateGroupById,
    addTemplatesToGroup,
    removeTemplatesFromGroup
};
