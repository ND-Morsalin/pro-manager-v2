import { Response } from 'express';
import jwt from 'jsonwebtoken'
import { CookiePayloadType } from 'types/types';

const setCookie = async (res:Response, payload:CookiePayloadType) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const expiresInMilliseconds = Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000;
  
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(
        Date.now() + expiresInMilliseconds
      ),
    });
  
    // console.log("token", token);
  
    return token;
  
  };

  export default setCookie;