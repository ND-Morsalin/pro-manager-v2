import { Router } from "express";
import shopOwnerBodyChecker from "../../middleware/shopOwner/shopOwnerValidator";
import handleValidationErrors from "../../middleware/handelValidatorError";
import logInValidator from "../../middleware/shopOwner/loginValidator";
import checkValidUser from "../../middleware/checkValidUser";
import {
  CreateShopOwner,
  deleteShopOwner,
  logIn,
  updateShopOwner,
  getShopOwnerById,
} from "./shopOwnerController";
import forgetPassword from "./forgetPass";
import checkOtp from "./checkOtp";
import resetPassword from "./resetPassword";

const router = Router();

router.post(
  "/create-shop-owner",
  shopOwnerBodyChecker,
  handleValidationErrors,
  CreateShopOwner
);

router.post("/login", logInValidator, handleValidationErrors, logIn);

router.post("/forget-password", forgetPassword);
router.post("/check-otp", checkOtp);
router.post("/reset-password", resetPassword);
router.put("/update-shop-owner/:id", checkValidUser, updateShopOwner);
router.get("/shop-owner/:id", checkValidUser, getShopOwnerById);
router.delete("/delete-shop-owner/:id", checkValidUser, deleteShopOwner);

export default router;
