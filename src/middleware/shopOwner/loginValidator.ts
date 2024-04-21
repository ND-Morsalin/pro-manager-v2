import { body } from "express-validator";

const logInValidator = [
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
];

export default logInValidator;
