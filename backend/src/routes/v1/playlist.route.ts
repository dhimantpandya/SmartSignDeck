import express from "express";
import validate from "../../middleware/validate";
import { playlistValidation } from "../../validations";
import { playlistController } from "../../controllers";
import auth from "../../middleware/auth";

const router = express.Router();

router
    .route("/")
    .post(
        auth(), // Require Auth
        validate(playlistValidation.createPlaylist),
        playlistController.createPlaylist
    )
    .get(
        auth(),
        validate(playlistValidation.getPlaylists),
        playlistController.getPlaylists
    );

router
    .route("/:playlistId")
    .get(
        auth(),
        validate(playlistValidation.getPlaylist),
        playlistController.getPlaylist
    )
    .patch(
        auth(),
        validate(playlistValidation.updatePlaylist),
        playlistController.updatePlaylist
    )
    .delete(
        auth(),
        validate(playlistValidation.deletePlaylist),
        playlistController.deletePlaylist
    );

export default router;

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlist management
 */
