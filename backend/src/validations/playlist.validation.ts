import Joi from "joi";
import { objectId } from "./custom.validation";

const createPlaylist = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        items: Joi.array().items(
            Joi.object().keys({
                url: Joi.string().required(),
                type: Joi.string().valid("image", "video").required(),
                duration: Joi.number().default(10),
                name: Joi.string().optional().allow(""),
            }),
        ),
    }),
};

const getPlaylists = {
    query: Joi.object().keys({
        name: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getPlaylist = {
    params: Joi.object().keys({
        playlistId: Joi.string().custom(objectId),
    }),
};

const updatePlaylist = {
    params: Joi.object().keys({
        playlistId: Joi.required().custom(objectId),
    }),
    body: Joi.object()
        .keys({
            name: Joi.string(),
            items: Joi.array().items(
                Joi.object().keys({
                    url: Joi.string().required(),
                    type: Joi.string().valid("image", "video").required(),
                    duration: Joi.number().default(10),
                    name: Joi.string().optional().allow(""),
                    _id: Joi.string().optional() // Allow keeping existing ID if sent back
                }),
            ),
        })
        .min(1),
};

const deletePlaylist = {
    params: Joi.object().keys({
        playlistId: Joi.string().custom(objectId),
    }),
};

export {
    createPlaylist,
    getPlaylists,
    getPlaylist,
    updatePlaylist,
    deletePlaylist,
};
