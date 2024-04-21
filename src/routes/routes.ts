import {
  CreateShopOwner,
  logIn,
} from "../controller/user/shopOwner/shopOwnerController";
import { Router } from "express";
import shopOwnerBodyChecker from "../middleware/user/shopOwner/shopOwnerValidator";
import handleValidationErrors from "../middleware/handelValidatorError";
import logInValidator from "../middleware/user/shopOwner/loginValidator";
import checkValidUser from "../middleware/checkValidUser";

const router = Router();

/**
 *  shop owner routes
 **/

// add shop owner
router.post(
  "/create-shop-owner",
  shopOwnerBodyChecker,
  handleValidationErrors,
  CreateShopOwner
);

// login route
router.post("/login", logInValidator, handleValidationErrors, logIn);

router.get("/", checkValidUser, (req, res) => {
  res.json({ message: "Hello, world!" });
});

// router.get("/shop-owner", CreateShopOwner);

export default router;
