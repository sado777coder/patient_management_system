const errorHandler = (err, req, res, next) => {
  console.error(" GLOBAL ERROR:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  res.status(err.status || 500).json({
    error: err.message,
    file: err.stack?.split("\n")[1], //  shows exact file
    stack:
      process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;