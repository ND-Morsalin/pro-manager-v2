import { Router } from "express";
import {
  createLoneProvider,
  deleteLoneProvider,
  getAllLoneProviders,
  getSingleLoneProvider,
  updateLoneProvider
} from "../../controller/loneProvider/loneProviderController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createLoneProvider);
router.get("/", checkValidUser, getAllLoneProviders);
router.get("/:id", checkValidUser, getSingleLoneProvider);
router.put("/:id", checkValidUser, updateLoneProvider);
router.delete("/:id", checkValidUser, deleteLoneProvider);

export default router;