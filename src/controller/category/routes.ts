import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
} from "./categoryController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createCategory);
router.get("/", checkValidUser, getAllCategory);
router.delete("/:id", checkValidUser, deleteCategory);

export default router;
