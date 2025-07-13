import { Router } from "express";
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSingleSupplier,
  updateSupplier,
} from "./supplierController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createSupplier);
router.get("/", checkValidUser, getAllSuppliers);
router.get("/:id", checkValidUser, getSingleSupplier);
router.put("/:id", checkValidUser, updateSupplier);
router.delete("/:id", checkValidUser, deleteSupplier);

export default router;
