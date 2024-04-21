import { body } from "express-validator";

const shopOwnerBodyChecker = [
  body("shopName")
    .trim()
    .isString()
    .withMessage("Invalid shop name")
    .notEmpty()
    .withMessage("Shop name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Shop name must be between 3 to 50 characters"),
  body("mobile")
    .notEmpty()
    .withMessage("mobile is required")
    .isMobilePhone("bn-BD")
    .withMessage("Invalid mobile number"),
  body("pincode")
    .notEmpty()
    .withMessage("Pin code is required")
    .isLength({ min: 4, max: 4 })
    .withMessage("Invalid pincode"),
  body("confirmPincode")
    .notEmpty()
    .withMessage("Pin code is required")
    .isLength({ min: 4, max: 4 })
    .withMessage("Invalid confirm Pincode"),
];

export default shopOwnerBodyChecker;
