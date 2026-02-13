import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
const xss = require('xss-clean');
import compression from "compression";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import httpStatus from "http-status";
import passport from "passport";
import config from "./config/config";
import * as morgan from "./config/morgan";
import { jwtStrategy } from "./config/passport";
import { errorConverter, errorHandler } from "./middleware/error";
import { authLimiter } from "./middleware/rateLimiter";
import routes from "./routes/v1";
import ApiError from "./utils/ApiError";
import cookieParser from "cookie-parser";
import path from "path";

// Global rate limiting for all endpoints
import rateLimit from "express-rate-limit";

const app: Application = express();

// Trust proxy - Set to 1 to tell Express we are behind exactly one proxy (Railway/Vercel)
app.set("trust proxy", 1);

// enable cors with proper configuration
// using origin: true reflects the request origin, effectively allowing any origin
// while still supporting credentials
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Allow-Headers"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Manual COOP/COEP Header overrides to ensure Google Sign-In works
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// HTTPS redirection in production
if (config.env === "production") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// set security HTTP headers with enhanced CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'", "https://accounts.google.com", "https://smart-sign-deck-18ef1.firebaseapp.com"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // We handle COOP manually above, so we disable it in helmet to avoid conflicts
    crossOriginOpenerPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// parse json request body - Increased limit for large tokens
app.use(express.json({ limit: '50kb' }));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// serve static files from uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Simple health check for Railway/Uptime
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use(cookieParser());

// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// v1 api routes
app.use("/v1", globalLimiter);
app.use("/v1", routes);

// Stricter rate limiting for auth endpoints
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

if (config.env === "production") {
  app.use("/v1/auth", strictAuthLimiter);
}

// Player endpoints rate limiter (prevent DDoS from screens)
const playerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: "Too many requests from this player, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Apply to player-specific endpoints
app.use("/v1/screens/:screenId", playerLimiter);
app.use("/v1/playback-logs", playerLimiter);

// send back a 404 error for any unknown api request
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
