import { Router } from "express";
import {
  yearlyCashReport,
  monthlyCashReport,
} from "../../controller/report/cashReport";
import checkValidUser from "../../middleware/checkValidUser";
import dashboardReport, { totalInvestment ,} from "../../controller/report/dashboardReport";

const router = Router();

router.get("/cash/:year", checkValidUser, yearlyCashReport);
router.get("/cash/:year/:month", checkValidUser, monthlyCashReport);
router.post("/dashboard", checkValidUser, dashboardReport);
router.get("/dashboard-products", checkValidUser, totalInvestment);

export default router;