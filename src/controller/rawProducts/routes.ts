import { Router } from "express";
import {
  addRawProduct,
  deleteRawProduct,
  getAllRawProducts,
  getRawProductReport,
  getRawSingleProduct,
  updateRawProduct,
  useRawProductForProduction
} from "../../controller/rawProducts/rawProductController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, addRawProduct);
router.get("/", checkValidUser, getAllRawProducts);
router.get("/:id", checkValidUser, getRawSingleProduct);
router.put("/:id", checkValidUser, updateRawProduct);
router.delete("/:id", checkValidUser, deleteRawProduct);
router.put("/to-production/:id", checkValidUser, useRawProductForProduction);
router.get("/raw-report", checkValidUser, getRawProductReport);

export const rawProductsRouter = router;
