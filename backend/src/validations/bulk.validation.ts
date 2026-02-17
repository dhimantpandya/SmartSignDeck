import Joi from "joi";
import { objectId } from "./custom.validation";

const bulkDelete = {
    body: Joi.object().keys({
        ids: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),
    }),
};

export default {
    bulkDelete,
};
