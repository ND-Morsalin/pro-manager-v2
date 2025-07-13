import { Router } from "express";
import {
  crateCash,
  createManyCash,
  getAllCash,
  getTodayCash,
  getTodayCashInHistory,
  getTodayCashOutHistory, 
} from "../../controller/cash/cashController";
import checkValidUser from "../../middleware/checkValidUser";
import { dailySellingReport } from "../../controller/report/dailySellingReport";

const router = Router();

router.post("/", checkValidUser, crateCash);
router.post("/create-many", checkValidUser, createManyCash);
router.get("/", checkValidUser, getAllCash);
router.get("/today/:today", checkValidUser, getTodayCash);
router.get("/daily-sell", checkValidUser, dailySellingReport);
router.get("/today-cash-in/:today", checkValidUser, getTodayCashInHistory);
router.get("/today-cash-out/:today", checkValidUser, getTodayCashOutHistory);

export default router;