const errorHandler = (err, req, res, next) => {
  console.error(" GLOBAL ERROR:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  const errorResponse = {
  error: err.message,
  file: err.stack?.split("\n")[1],
};

if (process.env.NODE_ENV === "development") {
  errorResponse.stack = err.stack;
}

res.status(err.status || 500).json(errorResponse);
};

module.exports = errorHandler;