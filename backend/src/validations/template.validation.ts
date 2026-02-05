import Joi from "joi";

const createTemplate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    resolution: Joi.string().default("1920x1080"),
    zones: Joi.array()
      .items(
        Joi.object().keys({
          _id: Joi.string().optional(), // MongoDB auto-generated ID
          id: Joi.string().required(),
          name: Joi.string().optional().allow(""),
          type: Joi.string()
            .required()
            .valid("video", "image", "text", "mixed"),
          x: Joi.number().required(),
          y: Joi.number().required(),
          width: Joi.number().required(),
          height: Joi.number().required(),
          media: Joi.array().optional(),
          mediaType: Joi.string().optional().valid('image', 'video', 'both'),
          lockedMediaType: Joi.string().optional().allow(null).valid('image', 'video', 'both'),
        }),
      )
      .required(),
    isPublic: Joi.boolean(),
  }),
};

const getTemplates = {
  query: Joi.object().keys({
    name: Joi.string(),
    createdBy: Joi.string(),
    isPublic: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    trashed: Joi.boolean(),
  }),
};

const getTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          return helpers.message({
            custom: '"templateId" must be a valid mongo id',
          });
        }
        return value;
      }),
  }),
};

const updateTemplate = {
  params: Joi.object().keys({
    templateId: Joi.required().custom((value, helpers) => {
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message({
          custom: '"templateId" must be a valid mongo id',
        });
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      resolution: Joi.string(),
      zones: Joi.array().items(
        Joi.object().keys({
          _id: Joi.string().optional(), // MongoDB auto-generated ID
          id: Joi.string().required(),
          name: Joi.string().optional().allow(""),
          type: Joi.string()
            .required()
            .valid("video", "image", "text", "mixed"),
          x: Joi.number().required(),
          y: Joi.number().required(),
          width: Joi.number().required(),
          height: Joi.number().required(),
          media: Joi.array().optional(),
          mediaType: Joi.string().optional().valid('image', 'video', 'both'),
          lockedMediaType: Joi.string().optional().allow(null).valid('image', 'video', 'both'),
        }),
      ),
      isActive: Joi.boolean(),
      isPublic: Joi.boolean(),
    })
    .min(1),
};

const deleteTemplate = {
  params: Joi.object().keys({
    templateId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          return helpers.message({
            custom: '"templateId" must be a valid mongo id',
          });
        }
        return value;
      }),
  }),
};

export default {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
};
