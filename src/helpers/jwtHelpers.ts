import jwt, { JwtPayload, Secret } from "jsonwebtoken";

class JwtHelpers {
  static createToken(
    payload: Record<string, unknown>,
    secret: Secret,
    expireTime: string
  ): string {
    return jwt.sign(payload, secret, {
      expiresIn: expireTime,
    });
  }

  static verifyToken(token: string, secret: Secret): JwtPayload {
    return jwt.verify(token, secret) as JwtPayload;
  }
}

export default JwtHelpers;
