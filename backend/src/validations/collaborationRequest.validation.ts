import Joi from "joi";
import { objectId } from "./custom.validation";

const sendRequest = {
    body: Joi.object().keys({
        recipientId: Joi.string().required().custom(objectId),
        templateId: Joi.string().required().custom(objectId),
        message: Joi.string().max(500).allow("", null),
    }),
};

const getRequests = {
    query: Joi.object().keys({
        status: Joi.string().valid("pending", "accepted", "declined", "cancelled"),
        type: Joi.string().valid("incoming", "outgoing"),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const respondToRequest = {
    params: Joi.object().keys({
        requestId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        status: Joi.string().required().valid("accepted", "declined"),
    }),
};

const cancelRequest = {
    params: Joi.object().keys({
        requestId: Joi.string().required().custom(objectId),
    }),
};

export default {
    sendRequest,
    getRequests,
    respondToRequest,
    cancelRequest,
};
