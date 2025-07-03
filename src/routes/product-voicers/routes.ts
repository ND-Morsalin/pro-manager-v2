import { Router } from "express";
import {
  createProductVoicer,
  getAllProductVoicer,
  getProductVoicersWithoutCustomer,
  getSingleProductVoicer
} from "../../controller/productVoicer/productVoicerController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createProductVoicer);
router.get("/without-customer", checkValidUser, getProductVoicersWithoutCustomer);
router.get("/:customerid", checkValidUser, getAllProductVoicer);
router.get("/single/:id", checkValidUser, getSingleProductVoicer);

export default router;