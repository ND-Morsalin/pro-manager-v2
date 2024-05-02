import axios from "axios";
import { Request, Response } from "express";

const forgetPassword = async (req: Request, res: Response) => {
  try {
    console.log("forgetPassword");
    const url = "http://bulksmsbd.net/api/smsapi";
    const apiKey = "3CuemU2YW4dCNqDJulbJ";
    const senderid = "8809617618303";
    const numbers = "8801646653053";
    const message = "test sms check";
 
    const data = {
        api_key: apiKey,
        senderid: senderid,
        number: numbers,
        message: message
    };

    const smsPost = await axios.get(`http://bulksmsbd.net/api/smsapi?api_key=3CuemU2YW4dCNqDJulbJ&type=text&number=8801646653053&senderid=8809617618303&message=TestSMS`);
    res.status(200).json({ message: "SMS sent successfully", smsPost: smsPost.data});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export default forgetPassword;
