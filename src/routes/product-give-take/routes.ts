import { Router } from "express";
import {
  createProductGive,
  createProductReceive,
  deleteProductGive,
  deleteProductReceive,
  getProductGive,
  getProductReceive,
  getSingleProductGive,
  getSingleProductReceive,
  updateProductGive,
  updateProductReceive
} from "../../controller/productGiveTake/productGiveTake";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.get("/give", checkValidUser, getProductGive);
router.get("/receive", checkValidUser, getProductReceive);
router.get("/give/:id", checkValidUser, getSingleProductGive);
router.get("/receive/:id", checkValidUser, getSingleProductReceive);
router.put("/give/:id", checkValidUser, updateProductGive);
router.put("/receive/:id", checkValidUser, updateProductReceive);
router.delete("/give/:id", checkValidUser, deleteProductGive);
router.delete("/receive/:id", checkValidUser, deleteProductReceive);
router.post("/give", checkValidUser, createProductGive);
router.post("/receive", checkValidUser, createProductReceive);

export default router;