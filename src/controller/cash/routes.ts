import { Router } from "express";
import {
  crateCash,
  createManyCash,
  getAllCash,
  getCashBalance,
  getTodayCash,
  getTodayCashInHistory,
  getTodayCashOutHistory, 
} from "../../controller/cash/cashController";
import checkValidUser from "../../middleware/checkValidUser";
import { dailySellingReport } from "../../controller/report/dailySellingReport";

const router = Router();

router.post("/", checkValidUser, crateCash);
// router.post("/create-many", checkValidUser, createManyCash);
router.get("/", checkValidUser, getAllCash);
// router.get("/cash-history", checkValidUser, getAllCashHistory);
// router.get("/today/:today", checkValidUser, getTodayCash);
router.get("/balance", checkValidUser, getCashBalance);
router.get("/daily-sell", checkValidUser, dailySellingReport);
router.get("/cash-in/:date", checkValidUser, getTodayCashInHistory);
router.get("/cash-out/:date", checkValidUser, getTodayCashOutHistory);

export default router;