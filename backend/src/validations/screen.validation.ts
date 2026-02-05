import Joi from "joi";
import config from "../config/config";

const contentSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().keys({
    type: Joi.string().valid("video", "image", "text", "mixed").required(),
    sourceType: Joi.string().valid("local", "playlist").optional(),
    playlistId: Joi.string().allow('').optional(),
    text: Joi.string().allow('').optional(),
    style: Joi.object().unknown(true).optional(),
    colorSequence: Joi.array().items(
      Joi.object().keys({
        color: Joi.string().required(),
        duration: Joi.number().min(1).required()
      })
    ).optional(),
    playlist: Joi.array()
      .items(
        Joi.object().keys({
          url: Joi.string()
            .required()
            .uri({ scheme: ['https', 'http'] })
            .custom((value, helpers) => {
              // Production: Only allow Cloudinary or specific trusted domains
              const allowedDomains = [
                'res.cloudinary.com',
                'cloudinary.com',
                'localhost', // Allow localhost for development
              ];
              try {
                const url = new URL(value);
                const allowedCors = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];
                const isAllowed = allowedCors.some((domain: string) => url.hostname.endsWith(domain)) ||
                  allowedDomains.some((domain: string) => url.hostname.endsWith(domain));
                if (!isAllowed) {
                  return helpers.message({ custom: `URL domain ${url.hostname} is not in the allowed whitelist` });
                }
              } catch (e) {
                return helpers.message({ custom: 'Invalid URL format' });
              }
              return value;
            }),
          duration: Joi.number().required(),
          type: Joi.string().valid("video", "image").required(),
        }),
      )
      .optional(),
  }),
);

const createScreen = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    location: Joi.string(),
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
    defaultContent: contentSchema.required(),
    schedules: Joi.array()
      .items(
        Joi.object().keys({
          _id: Joi.string().optional(),
          name: Joi.string().required(),
          startTime: Joi.string()
            .required()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string()
            .required()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          content: contentSchema.required(),
        }),
      )
      .default([]),
    status: Joi.string().valid("online", "offline", "maintenance"),
  }),
};

const getScreens = {
  query: Joi.object().keys({
    name: Joi.string(),
    templateId: Joi.string(),
    createdBy: Joi.string(),
    isPublic: Joi.boolean(),
    status: Joi.string().valid("online", "offline", "maintenance"),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    trashed: Joi.boolean(),
  }),
};

const getScreen = {
  params: Joi.object().keys({
    screenId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          return helpers.message({
            custom: '"screenId" must be a valid mongo id',
          });
        }
        return value;
      }),
  }),
};

const updateScreen = {
  params: Joi.object().keys({
    screenId: Joi.required().custom((value, helpers) => {
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message({
          custom: '"screenId" must be a valid mongo id',
        });
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      location: Joi.string(),
      templateId: Joi.string().custom((value, helpers) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          return helpers.message({
            custom: '"templateId" must be a valid mongo id',
          });
        }
        return value;
      }),
      defaultContent: contentSchema,
      schedules: Joi.array().items(
        Joi.object().keys({
          _id: Joi.string().optional(),
          name: Joi.string().required(),
          startTime: Joi.string()
            .required()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string()
            .required()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          content: contentSchema.required(),
        }),
      ),
      status: Joi.string().valid("online", "offline", "maintenance"),
    })
    .min(1),
};

const deleteScreen = {
  params: Joi.object().keys({
    screenId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          return helpers.message({
            custom: '"screenId" must be a valid mongo id',
          });
        }
        return value;
      }),
  }),
};

export default {
  createScreen,
  getScreens,
  getScreen,
  updateScreen,
  deleteScreen,
};
