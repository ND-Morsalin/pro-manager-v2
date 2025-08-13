import { Router } from "express";
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSingleSupplier,
  getSupplierPaymentHistory,
  supplierCashSupplier,
  updateSupplier,
} from "./supplierController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createSupplier);
router.get("/", checkValidUser, getAllSuppliers);
router.get("/:id", checkValidUser, getSingleSupplier);
router.put("/:id", checkValidUser, updateSupplier);
router.put("/supplier-cash/:id", checkValidUser, supplierCashSupplier);
router.delete("/:id", checkValidUser, deleteSupplier);

router.get("/supplier-payment/:supplierId", checkValidUser, getSupplierPaymentHistory )

export default router;
