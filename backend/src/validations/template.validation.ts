import Joi from "joi";
import { objectId } from "./custom.validation";

const createTemplate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    resolution: Joi.string().required(),
    zones: Joi.array().required(),
    visibility: Joi.string().valid('private', 'company', 'public'),
    previewUrl: Joi.string().allow('', null),
    previewType: Joi.string().valid('image', 'video').allow('', null),
  }),
};

const getTemplates = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    createdBy: Joi.string().custom(objectId),
  }),
};

const getTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string().custom(objectId),
  }),
};

const updateTemplate = {
  params: Joi.object().keys({
    templateId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      resolution: Joi.string(),
      zones: Joi.array(),
      visibility: Joi.string().valid("private", "company", "public"),
      previewUrl: Joi.string().allow('', null),
      previewType: Joi.string().valid('image', 'video').allow('', null),
    })
    .min(1),
};

const deleteTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string().custom(objectId),
  }),
};

export default {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
};
