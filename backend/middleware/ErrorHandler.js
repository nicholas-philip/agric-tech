// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  if (!(err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    console.error(err);
  }

  // JSON syntax error (e.g., malformed body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.statusCode = 400;
    error.message = 'Malformed JSON body';
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.statusCode = 404;
    error.message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.statusCode = 400;
    error.message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token expired';
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
