export const authenticate = (req, res, next) => {
  const user = req.headers["x-user"];

  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    req.user = JSON.parse(user);
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid user data" });
  }
};
