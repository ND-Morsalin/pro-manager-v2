import { Router } from "express";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getSellingProductByDate,
  getSingleProduct,
  updateInventory,
  updateProduct
} from "../../controller/products/productsController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, addProduct);
router.get("/", checkValidUser, getAllProducts);
router.get("/:id", checkValidUser, getSingleProduct);
router.put("/:id", checkValidUser, updateProduct); // only update product information
router.put("/inventory/:id", checkValidUser, updateInventory); // only update product information
router.delete("/:id", checkValidUser, deleteProduct);
router.post("/selling-by-date", checkValidUser, getSellingProductByDate);

export default router;