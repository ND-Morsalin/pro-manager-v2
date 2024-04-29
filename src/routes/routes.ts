import {
  CreateShopOwner,
  logIn,
} from "../controller/shopOwner/shopOwnerController";
import { Router } from "express";
import shopOwnerBodyChecker from "../middleware/shopOwner/shopOwnerValidator";
import handleValidationErrors from "../middleware/handelValidatorError";
import logInValidator from "../middleware/shopOwner/loginValidator";
import checkValidUser from "../middleware/checkValidUser";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controller/products/productsController";
import productBodyChecker from "../middleware/products/productValidator";
import {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getSingleCustomer,
  updateCustomer,
} from "../controller/customer/customerController";
import {
  createCustomerPaymentHistory,
  deleteCustomerPaymentHistory,
  getAllCustomerPaymentHistory,
  getSingleCustomerPaymentHistory,
  updateCustomerPaymentHistory,
} from "../controller/customer/CustomerPaymentHistory";
import { createLoneProvider, deleteLoneProvider, getAllLoneProviders, getSingleLoneProvider, updateLoneProvider } from "../controller/loneProvider/loneProviderController";
import { createProductVoicer } from "../controller/productVoicer/productVoicerController";
import { createBusinessContactInfo, deleteBusinessContactInfo, getAllBusinessContactInfo, getSingleBusinessContactInfo, updateBusinessContactInfo } from "../controller/businessContactInfo/businessContactInfo";
import { crateCash, getAllCash } from "../controller/cash/cashController";

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
router.post(
  "/product",
  checkValidUser,
  productBodyChecker,
  handleValidationErrors,
  addProduct
);

// get all products
router.get("/products", checkValidUser, getAllProducts);

// get single product
router.get("/product/:id", checkValidUser, getSingleProduct);

// update product
router.put("/product/:id", checkValidUser, updateProduct);

// delete product
router.delete("/product/:id", checkValidUser, deleteProduct);

/**
 * PRODUCT ROUTES end
 **/

/**
 * Customer ROUTES start
 **/
// create customer
router.post("/customer", checkValidUser, addCustomer);

// get all customers
router.get("/customers", checkValidUser, getAllCustomers);

// get single customer
router.get("/customer/:id", checkValidUser, getSingleCustomer);

// update customer
router.put("/customer/:id", checkValidUser, updateCustomer);

// delete customer
router.delete("/customer/:id", checkValidUser, deleteCustomer);

/**
 * Customer ROUTES end
 **/

/**
 * CustomerPaymentHistory ROUTES start
 **/

router.post(
  "/customer-payment-history",
  checkValidUser,
  createCustomerPaymentHistory
);

router.get(
  "/customer-payment-history",
  checkValidUser,
  getAllCustomerPaymentHistory
);

router.get(
  "/customer-payment-history/:id",
  checkValidUser,
  getSingleCustomerPaymentHistory
);

router.put(
  "/customer-payment-history/:id",
  checkValidUser,
  updateCustomerPaymentHistory
);

router.delete(
  "/customer-payment-history/:id",
  checkValidUser,
  deleteCustomerPaymentHistory
);

/**
 * CustomerPaymentHistory ROUTES end
 **/



/**
 * LoneProvider ROUTES start
 **/

// create lone provider
router.post("/lone-provider", checkValidUser, createLoneProvider);

// get all lone providers
router.get("/lone-providers", checkValidUser, getAllLoneProviders);

// get single lone provider
router.get("/lone-provider/:id", checkValidUser, getSingleLoneProvider);

// update lone provider
router.put("/lone-provider/:id", checkValidUser, updateLoneProvider);

// delete lone provider
router.delete("/lone-provider/:id", checkValidUser, deleteLoneProvider);

/**
 * LoneProvider ROUTES end
 **/




/**
 * createProductVoicer ROUTES end
 **/

router.post("/product-voicer", checkValidUser, createProductVoicer);


/**
 * createProductVoicer ROUTES end
 **/




/**
 * Business ContactInfo ROUTES start
 **/

router.post("/business-contact-info", checkValidUser, createBusinessContactInfo);

router.get("/business-contact-info", checkValidUser, getAllBusinessContactInfo);

router.get("/business-contact-info/:id", checkValidUser, getSingleBusinessContactInfo);

router.put("/business-contact-info/:id", checkValidUser, updateBusinessContactInfo);

router.delete("/business-contact-info/:id", checkValidUser, deleteBusinessContactInfo);

/**
 * Business ContactInfo ROUTES end
 **/




/**
 * Cash ROUTES start
 **/

router.post("/cash", checkValidUser, crateCash);

router.get("/cash", checkValidUser, getAllCash);




/**
 * Cash ROUTES end
 **/



export default router;
