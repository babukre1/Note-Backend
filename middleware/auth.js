module.exports = function (req, res, next) {
  console.log("Session User ID:", req.session?.user?.id); // Use optional chaining

  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.status(401).json({ msg: "Not authenticated" });
  }

  req.user = req.session.user;
  next();
};