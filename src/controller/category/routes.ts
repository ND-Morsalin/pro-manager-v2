import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  getSingleCategory,
  updateCategory,
} from "./categoryController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createCategory);
router.get("/", checkValidUser, getAllCategory);
router.get("/:id", checkValidUser, getSingleCategory);
router.put("/:id", checkValidUser, updateCategory);
router.delete("/:id", checkValidUser, deleteCategory);

export default router;
