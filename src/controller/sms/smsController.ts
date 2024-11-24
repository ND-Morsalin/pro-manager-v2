import axios from "axios";
import { Response } from "express";
import { ExtendedRequest } from "types/types";

const sendMessageToAll = async (req: ExtendedRequest, res: Response) => {
  try {
    const { numbers, message } = req.body as {
      message: string;
      numbers: string[];
    };
    const smsPost = await axios.get(
      `http://bulksmsbd.net/api/smsapi?api_key=3CuemU2YW4dCNqDJulbJ&type=text&number=88${numbers.join(
        ","
      )}&senderid=8809617618303&message=Manager.com ${message}`
    );
    console.log({
      smsPost: smsPost.data,
    });

    return res.status(200).json({
      success: true,
      message: `Message send successfully to all of this numbers ${numbers.join(
        ", "
      )}`,

      smsPost: smsPost.data,
    });
  } catch (error) {
    console.log({ error });
    res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "server error",
          msg: "Internal server error",
          path: "server",
          location: "sendMessageToAll  function",
        },
      ],
    });
  }
};

export { sendMessageToAll };
