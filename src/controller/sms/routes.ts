import { Router } from "express";
import {
  confirmOrder,
  createSMSPackage,
  getAllPaidOrdersSms,
  getAllSmsPackages,
  getAllUnpaidOrdersSms,
  orderSms,
  sendMessageToAll,
} from "../../controller/sms/smsController";
import checkValidUser from "../../middleware/checkValidUser";
import verifyToken from "../../middleware/verifyToken";
import { Verify } from "crypto";

const router = Router();

router.post("/send-to-all", checkValidUser, sendMessageToAll);
router.post("/create-sms-package", verifyToken(['ADMIN']), createSMSPackage); // only for super admin
router.patch("/admin/confirm-order/:smsOrderId", verifyToken(["ADMIN"]), confirmOrder); // only for super admin
router.get("/get-all-sms-packages", checkValidUser, getAllSmsPackages);
router.post("/order-sms", checkValidUser, orderSms);
router.get(
  "/admin/get-all-unpaid-orders-sms",
  verifyToken(["ADMIN"]),
  getAllUnpaidOrdersSms
);
router.get(
  "/admin/get-all-paid-orders-sms",
  verifyToken(["ADMIN"]),
  getAllPaidOrdersSms
);

export default router;
