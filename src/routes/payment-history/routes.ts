import { Router } from "express";
import {
  createCustomerPaymentHistory,
  deleteCustomerPaymentHistory,
  getAllCustomerPaymentHistory,
  getSingleCustomerPaymentHistory,
  updateCustomerPaymentHistory
} from "../../controller/customer/CustomerPaymentHistory";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createCustomerPaymentHistory);
router.get("/", checkValidUser, getAllCustomerPaymentHistory);
router.get("/:id", checkValidUser, getSingleCustomerPaymentHistory);
router.put("/:id", checkValidUser, updateCustomerPaymentHistory);
router.delete("/:id", checkValidUser, deleteCustomerPaymentHistory);

export default router;