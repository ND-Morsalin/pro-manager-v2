import { Router } from "express";
import { sendMessageToAll } from "../../controller/sms/smsController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/send-to-all", checkValidUser, sendMessageToAll);

export default router;