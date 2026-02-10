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

// Trust proxy - CRITICAL for Vercel/Render deployment
// This allows Express to read the real client IP from X-Forwarded-For header
// Without this, all users appear as the same IP (proxy IP) and share rate limits
app.set('trust proxy', true);

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
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "https:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// parse json request body
app.use(express.json({ limit: '10kb' }));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// set etag support
app.set('etag', 'strong');

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors with proper configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = Array.isArray(config.cors.origin)
      ? config.cors.origin
      : [config.cors.origin];

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// serve static files from uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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
