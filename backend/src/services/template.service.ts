import httpStatus from 'http-status';
import Template from '../models/template.model';
import ApiError from '../utils/ApiError';
import mongoose from 'mongoose';
import templateGroupService from './templateGroup.service';

/**
 * Mapping for inspiration preview URLs
 */
const INSPIRATION_PREVIEW_URLS: Record<string, string> = {
  'Corporate Excellence': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/corporate-preview.jpg',
  'Retail Dynamic': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/retail-preview.jpg',
  'Hospitality Welcome': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/hospitality-preview.jpg',
  'Healthcare Info': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/healthcare-preview.jpg',
  'EduConnect Hub': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/education-preview.jpg',
  'Modern Menu Board': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/menu-preview.jpg',
  'Fitness Motivation': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/fitness-preview.jpg',
  'Financial Ticker': 'https://res.cloudinary.com/djp7v6p9v/image/upload/v1741517467/templates/finance-preview.jpg'
};

/**
 * Create a template
 */
const createTemplate = async (templateBody: any, user: any) => {
  const finalBody = {
    ...templateBody,
    createdBy: user._id || user.id,
    companyId: user.companyId
  };
  return Template.create(finalBody);
};

/**
 * Query for templates
 */
const queryTemplates = async (filter: any, options: any, user?: any) => {
  const finalFilter: any = { ...filter };
  
  // Standardize deletedAt check
  const isRecycleBinQuery = finalFilter.trashed === true;
  if (isRecycleBinQuery) {
    finalFilter.deletedAt = { $ne: null };
  } else {
    finalFilter.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];
  }
  delete finalFilter.trashed;

  // STRICT ISOLATION: For Recycle Bin, ONLY show items created BY the current user
  // No exceptions for roles (Super Admin, etc.)
  if (isRecycleBinQuery && user) {
    finalFilter.createdBy = user._id || user.id;
  }

  // Security & Visibility Logic
  if (!isRecycleBinQuery && user && user.role !== 'super_admin') {
    const visibilityFilter = {
      $or: [
        { companyId: user.companyId },
        { visibility: { $in: ['public', 'global'] } }
      ]
    };
    
    // Use $and to combine user filters (e.g. createdBy) with visibility rules
    const combinedFilter = { $and: [finalFilter, visibilityFilter] };
    return (Template as any).paginate(combinedFilter, {
      ...options,
      populate: 'createdBy'
    });
  }

  const templates = await (Template as any).paginate(finalFilter, {
    ...options,
    populate: 'createdBy'
  });
  return templates;
};

/**
 * Get template by id
 */
const getTemplateById = async (id: string, user?: any) => {
  const template = await Template.findById(id).populate('createdBy');
  if (template && user && user.role !== 'super_admin') {
     if (template.visibility !== 'public' && template.visibility !== 'global' && template.companyId?.toString() !== user.companyId?.toString()) {
       return null;
     }
  }
  return template;
};

/**
 * Update template by id
 */
const updateTemplateById = async (templateId: string, updateBody: any, user?: any) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }

  if (user && user.role !== 'super_admin' && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  Object.assign(template, updateBody);
  (template as any).lastModifiedBy = user?._id || user?.id;
  await template.save();
  return template;
};

/**
 * Delete template by id
 */
const deleteTemplateById = async (templateId: string, user?: any) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }

  if (user && user.role !== 'super_admin' && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  template.deletedAt = new Date();
  await template.save();
  return template;
};

/**
 * Restore template by id
 */
const restoreTemplateById = async (templateId: string, user?: any) => {
  const template = await Template.findOne({ _id: templateId });
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }

  if (user && user.role !== 'super_admin' && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  template.deletedAt = undefined as any;
  await template.save();
  return template;
};

/**
 * Permanently delete template by id
 */
const permanentDeleteTemplateById = async (templateId: string, user?: any) => {
  const template = await Template.findOne({ _id: templateId });
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }

  if (user && user.role !== 'super_admin' && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  await template.deleteOne();
  return template;
};

/**
 * Delete templates by ids (bulk)
 */
const deleteTemplatesByIds = async (ids: string[], user: any) => {
  const filter: any = { _id: { $in: ids } };
  if (user.role !== 'super_admin') {
    filter.companyId = user.companyId;
  }
  return Template.updateMany(filter, { deletedAt: new Date() });
};

/**
 * Clone a template
 */
const cloneTemplate = async (templateId: string, user: any) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }

  const clonedTemplate = await Template.create({
    name: `${template.name} (Copy)`,
    resolution: template.resolution,
    zones: template.zones,
    createdBy: user._id || user.id,
    companyId: user.companyId,
    visibility: 'private' as const,
    previewUrl: (template as any).previewUrl,
    previewType: (template as any).previewType || 'image'
  });

  return clonedTemplate;
};

/**
 * Bootstrap from inspiration
 */
const bootstrapFromInspiration = async (name: string, user: any) => {
  const userId = user._id || user.id;
  const companyId = user.companyId;
  // Mock zones based on name
  const isMenu = name.toLowerCase().includes('menu');
  const zones = isMenu ? [
    { id: 'zone-1', name: 'Menu Left', type: 'image', x: 0, y: 0, width: 640, height: 1080, media: [] },
    { id: 'zone-2', name: 'Menu Right', type: 'image', x: 640, y: 0, width: 640, height: 1080, media: [] },
    { id: 'zone-3', name: 'Footer', type: 'text', x: 0, y: 1000, width: 1920, height: 80, media: [] }
  ] : [
    { id: 'zone-1', name: 'Main Content', type: 'mixed', x: 0, y: 0, width: 1440, height: 1080, media: [] },
    { id: 'zone-2', name: 'Sidebar', type: 'mixed', x: 1440, y: 0, width: 480, height: 1080, media: [] }
  ];

  const previewUrl = INSPIRATION_PREVIEW_URLS[name] || '';

  // Create a group first
  const group = await templateGroupService.createTemplateGroup({
    name: `${name} Group`,
    description: `Auto-generated from ${name} inspiration`,
    companyId: companyId as any,
    createdBy: userId as any
  });

  // Create 3 templates
  const templatePromises = ['Variation A', 'Variation B', 'Variation C'].map(suffix => 
    Template.create({
      name: `${name} - ${suffix}`,
      resolution: '1920x1080',
      zones,
      companyId: companyId as any,
      createdBy: userId as any,
      visibility: 'company' as const,
      previewUrl,
      previewType: 'image' as const
    })
  );

  const templates = await Promise.all(templatePromises);
  const templateIds = templates.map(t => t._id.toString());

  // Add to group
  await templateGroupService.addTemplatesToGroup((group as any)._id?.toString() || (group as any).id, templateIds);

  return templates[0];
};

export default {
  createTemplate,
  queryTemplates,
  getTemplateById,
  updateTemplateById,
  deleteTemplateById,
  restoreTemplateById,
  permanentDeleteTemplateById,
  deleteTemplatesByIds,
  cloneTemplate,
  bootstrapFromInspiration
};
