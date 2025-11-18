import logger from "../config/logger.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  logger.error(
    {
      err,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
    },
    err.message
  );

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    details:
      process.env.NODE_ENV === "production" ? undefined : err.stack || "",
  });
};


