/* import { Request, Response } from "express";
import { UserType } from "types/types";
import prisma from "utility/prisma";

const newUser = async (req: Request, res: Response) => {
  try {
    const {
      address,
      email,
      name,
      uniqueId,
      surname,
      company,
    } = req.body as unknown as UserType;

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        surname,
        company: company || null,
        address,
        uniqueId

      },
    });
    res.status(200).json({ success: true, user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error });
  }
};

export { newUser };
 */