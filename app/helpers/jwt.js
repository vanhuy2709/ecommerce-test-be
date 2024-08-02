const { expressjwt } = require("express-jwt");

function authJwt() {
  const secretKey = process.env.SECRET_KEY;

  return expressjwt({
    secret: secretKey,
    algorithms: ['HS256'],
    isRevoked: isRevoked
  }).unless({
    path: [
      { url: /\/public\/uploads(.*)/, method: ['GET', 'OPTIONS'] },
      { url: /\/api\/products(.*)/, method: ['GET', 'OPTIONS'] },
      { url: /\/api\/categories(.*)/, method: ['GET', 'OPTIONS'] },
      { url: /\/api\/users(.*)/, method: ['GET', 'OPTIONS', 'PUT', 'POST'] },
      { url: /\/api\/orders(.*)/, method: ['GET', 'OPTIONS', 'POST', 'DELETE'] },
      /\/api\/messages(.*)/,
      /\/api\/chats(.*)/,
      /\/api\/comments(.*)/,
      /\/api\/auth\/login(.*)/,
      /\/api\/auth\/register(.*)/,
    ]
  })
}

async function isRevoked(req, jwt) {
  if (!jwt.payload.isAdmin) {
    return true;
  }

  return false;
}

module.exports = authJwt;