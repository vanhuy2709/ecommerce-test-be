const jwt = require('jsonwebtoken');

// Verify Token
const middlewareController = {
  // verifyToken
  verifyToken: (req, res, next) => {
    const token = req.headers.token;

    if (token) {
      const accessToken = token.split(" ")[1];
      jwt.verify(accessToken, process.env.SECRET_KEY, (err, user) => {
        if (err) {
          res.status(403).json('Token is not valid');
        }
        req.user = user;
        next();
      });
    } else {
      res.status(401).json("You're not authenticated");
    }
  },

  // verifyToken and Admin
  verifyTokenAndAdminAuth: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.userId === req.params.userId || req.user.isAdmin) {
        next();
      } else {
        res.status(403).json("You're not allowed to delete other");
      }
    })
  }
}


module.exports = middlewareController;