// Generic error handler middleware placeholder.
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Unexpected error';
  res.status(status).json({ message });
};

module.exports = errorHandler;
