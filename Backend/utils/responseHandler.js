// #region ResponseHandler

/**
 * Response Handler Utilities
 */

export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, message = "An error occurred", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
};

export const sendValidationError = (res, errors = []) => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors
  });
};
