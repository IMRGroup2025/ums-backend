export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      message:
        "Cannot delete record because related data exists",
    });
  }

  res.status(500).json({
    message: "Internal Server Error",
  });
};
