import { Router } from "express"; 
import checkValidUser from "../../middleware/checkValidUser";
import { getDashboardData } from "./dashboard.controller";

const router = Router();

router.get("/", checkValidUser, getDashboardData);

export default router;
