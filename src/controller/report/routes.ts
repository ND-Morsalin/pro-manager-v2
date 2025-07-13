import { Router } from "express";
// import { yearlyCashReport, monthlyCashReport } from "./cashReport";
import checkValidUser from "../../middleware/checkValidUser";
// import dashboardReport, { totalInvestment } from "./dashboardReport";
import {
  generateDailyPurchaseReport,
  generateMonthlyPurchaseReport,
  generateYearlyPurchaseReport,
  getPurchaseReports,
  getSellingReport,
} from "./report.controller";

const router = Router();

router.get(
  "/purchase-report/daily",
  checkValidUser,
  generateDailyPurchaseReport
);

router.get(
  "/purchase-report/monthly",
  checkValidUser,
  generateMonthlyPurchaseReport
);

router.get(
  "/purchase-report/yearly",
  checkValidUser,
  generateYearlyPurchaseReport
);

router.get("/purchase-reports", checkValidUser, getPurchaseReports);
router.get("/selling-reports", checkValidUser, getSellingReport);

export default router;
