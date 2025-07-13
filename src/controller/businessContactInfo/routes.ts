import { Router } from "express";
import {
  createBusinessContactInfo,
  deleteBusinessContactInfo,
  getAllBusinessContactInfo,
  getSingleBusinessContactInfo,
  updateBusinessContactInfo,
} from "./businessContactInfo";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createBusinessContactInfo);
router.get("/", checkValidUser, getAllBusinessContactInfo);
router.get("/:id", checkValidUser, getSingleBusinessContactInfo);
router.put("/:id", checkValidUser, updateBusinessContactInfo);
router.delete("/:id", checkValidUser, deleteBusinessContactInfo);

export default router;
