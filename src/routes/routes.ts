import {
  CreateShopOwner,
  logIn,
} from "../controller/shopOwner/shopOwnerController";
import { Router } from "express";
import shopOwnerBodyChecker from "../middleware/shopOwner/shopOwnerValidator";
import handleValidationErrors from "../middleware/handelValidatorError";
import logInValidator from "../middleware/shopOwner/loginValidator";
import checkValidUser from "../middleware/checkValidUser";
import { addProduct, deleteProduct, getAllProducts, getSingleProduct, updateProduct } from "../controller/products/productsController";
import productBodyChecker from "../middleware/products/productValidator";

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
  return res.json({ message: "Hello, world!" });
});

// router.get("/shop-owner", CreateShopOwner);

/**
 * PRODUCT ROUTES start
 **/

// create product
router.post("/product", checkValidUser,productBodyChecker,handleValidationErrors, addProduct);

// get all products
router.get("/products", checkValidUser, getAllProducts);

// get single product
router.get("/product/:id",checkValidUser, getSingleProduct);

// update product
router.put("/product/:id",checkValidUser, updateProduct);

// delete product
router.delete("/product/:id",checkValidUser, deleteProduct);

/**
 * PRODUCT ROUTES end
 **/

export default router;
