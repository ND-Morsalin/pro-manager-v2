import { Router } from "express"; 
import checkValidUser from "../../middleware/checkValidUser";
import { getDashboardData, totalSell } from "./dashboard.controller";

const router = Router();

router.get("/", checkValidUser, getDashboardData);
router.get("/total-sell", checkValidUser, totalSell);

export default router;
