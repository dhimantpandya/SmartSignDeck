import express, { type Router } from "express";
import config from "../../config/config";
import authRoute from "./auth.route";
import docsRoute from "./docs.route";
import generalRoute from "./general.route";
import permissionRoute from "./permission.route";
import roleRoute from "./role.route";

import userRoute from "./user.route";
import templateRoute from "./template.route";
import adminRequestRoute from "./adminRequest.route";
import screenRoute from "./screen.route";
import signageRoute from "./signage.route";
import playbackLogRoute from "./playbackLog.route";
import cloudinaryRoute from "./cloudinary.route";
import healthRoute from "./health.route";
import analyticsRoute from "./analytics.route";
import socialRoute from "./social.route";
import companyRoute from "./company.route";
import playlistRoute from "./playlist.route";
import notificationRoute from "./notification.route";
// IMPORT ROUTE HERE

const router: Router = express.Router();

interface Route {
  path: string;
  route: Router;
}

const defaultRoutes: Route[] = [
  { path: "/", route: generalRoute },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/admin-requests",
    route: adminRequestRoute,
  },
  { path: "/roles", route: roleRoute },
  { path: "/permissions", route: permissionRoute },
  { path: "/templates", route: templateRoute },
  { path: "/screens", route: screenRoute },
  { path: "/signage", route: signageRoute },
  {
    path: "/playback-logs",
    route: playbackLogRoute,
  },
  { path: "/cloudinary", route: cloudinaryRoute },
  { path: "/health", route: healthRoute },
  { path: "/analytics", route: analyticsRoute },
  { path: "/social", route: socialRoute },
  { path: "/companies", route: companyRoute },
  { path: "/playlists", route: playlistRoute },
  { path: "/notifications", route: notificationRoute },
  // ROUTE DECLARATION
];

const devRoutes: Route[] = [
  // routes available only in development mode
  {
    path: "/docs",
    route: docsRoute,
  },
];

defaultRoutes.forEach((route: Route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === "development") {
  devRoutes.forEach((route: Route) => {
    router.use(route.path, route.route);
  });
}

export default router;
