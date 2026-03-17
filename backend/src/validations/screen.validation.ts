import Joi from "joi";
import { objectId } from "./custom.validation";

const createScreen = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    location: Joi.string().allow(""),
    templateId: Joi.string().required().custom(objectId),
    defaultContent: Joi.object(),
    schedules: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required(),
        startTime: Joi.string().required(),
        endTime: Joi.string().required(),
        daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)),
        startDate: Joi.date(),
        endDate: Joi.date(),
        priority: Joi.number(),
        content: Joi.object().required(),
      })
    ),
    isPublic: Joi.boolean(),
    visibility: Joi.string().valid("private", "company", "public"),
    showClock: Joi.boolean(),
    qrCodeUrl: Joi.string().allow('', null),
    previewUrl: Joi.string().allow('', null),
    previewType: Joi.string().valid('image', 'video').allow('', null),
  }),
};

const getScreens = {
  query: Joi.object().keys({
    name: Joi.string(),
    location: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    createdBy: Joi.string().custom(objectId),
    companyId: Joi.string().custom(objectId),
    visibility: Joi.string().valid("private", "company", "public"),
    trashed: Joi.boolean(),
    isPublic: Joi.boolean(),
    status: Joi.string().valid("online", "offline", "syncing"),
    templateId: Joi.string().custom(objectId),
  }),
};

const getScreen = {
  params: Joi.object().keys({
    screenId: Joi.string().custom(objectId),
  }),
};

const updateScreen = {
  params: Joi.object().keys({
    screenId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      location: Joi.string(),
      templateId: Joi.string().custom(objectId),
      defaultContent: Joi.object(),
      schedules: Joi.array().items(
        Joi.object().keys({
          name: Joi.string().required(),
          startTime: Joi.string().required(),
          endTime: Joi.string().required(),
          daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)),
          startDate: Joi.date(),
          endDate: Joi.date(),
          priority: Joi.number(),
          content: Joi.object().required(),
        })
      ),
      isPublic: Joi.boolean(),
      visibility: Joi.string().valid("private", "company", "public"),
      showClock: Joi.boolean(),
      qrCodeUrl: Joi.string().allow('', null),
      previewUrl: Joi.string().allow('', null),
      previewType: Joi.string().valid('image', 'video').allow('', null),
    })
    .min(1),
};

const deleteScreen = {
  params: Joi.object().keys({
    screenId: Joi.string().custom(objectId),
  }),
};

export default {
  createScreen,
  getScreens,
  getScreen,
  updateScreen,
  deleteScreen,
};
