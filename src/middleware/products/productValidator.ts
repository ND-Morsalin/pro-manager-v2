/* 
* This file is used to validate the request body of the product routes
* It uses express-validator to validate the request body
* It exports the validation middleware for the product routes
* here is the products type 
Product {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  productName     String
  stokeAmount          Float
  buyingPrice     Float
  sellingPrice    Float
  productCategory String
  productBrand    String
  unit            String // kg, g, l, ml, etc
  shopOwner       ShopOwner @relation(fields: [shopOwnerId], references: [id])
  shopOwnerId     String    @db.ObjectId

  sellingHistory SellingProduct[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
*/

import { body } from "express-validator";

const productBodyChecker = [
  body("productName")
    .isString()
    .withMessage("Product name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters long"),
  body("stokeAmount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),
  body("buyingPrice")
    .isNumeric()
    .withMessage("Buying price must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Buying price must be a positive number"),
  body("sellingPrice")
    .isNumeric()
    .withMessage("Selling price must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Selling price must be a positive number"),
  body("productCategory")
    .isString()
    .withMessage("Product category must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product category must be between 2 and 100 characters long"),
  body("productBrand")
    .isString()
    .withMessage("Product brand must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Product brand must be between 2 and 50 characters long"),
  body("unit")
    .isString()
    .withMessage("Unit must be a string")
    .isLength({ min: 1, max: 20 })
    .withMessage("Unit must be between 1 and 20 characters long"),
  
];

export default productBodyChecker;
