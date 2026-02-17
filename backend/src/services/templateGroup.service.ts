import httpStatus from "http-status";
import { TemplateGroup } from "../models";
import ApiError from "../utils/ApiError";
import type { ITemplateGroup } from "../models/templateGroup.model";
import type { FilterQuery } from "mongoose";
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
    const groups = await TemplateGroup.paginate(filter, options);
    return groups;
};

/**
 * Get template group by id
 * @param {string} id
 * @returns {Promise<ITemplateGroup | null>}
 */
const getTemplateGroupById = async (id: string): Promise<ITemplateGroup | null> => {
    return TemplateGroup.findById(id).populate('templates');
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
        group.templates.push(...(newTemplates.map(id => new (require('mongoose')).Types.ObjectId(id))));
        await group.save();
    }

    return group;
};

export default {
    createTemplateGroup,
    queryTemplateGroups,
    getTemplateGroupById,
    updateTemplateGroupById,
    deleteTemplateGroupById,
    addTemplatesToGroup
};
