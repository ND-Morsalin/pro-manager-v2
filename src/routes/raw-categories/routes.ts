import { Router } from "express";
import {
  createRawCategory,
  deleteRawCategory,
  getAllRawCategory,
  getSingleRawCategory,
  updateRawCategory
} from "../../controller/rawCategory/rawCategoryController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createRawCategory);
router.get("/", checkValidUser, getAllRawCategory);
router.get("/:id", checkValidUser, getSingleRawCategory);
router.put("/:id", checkValidUser, updateRawCategory);
router.delete("/:id", checkValidUser, deleteRawCategory);

export default router;