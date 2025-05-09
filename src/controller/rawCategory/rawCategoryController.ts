import { Request, Response } from "express";
import prisma from "../../utility/prisma";
import { ExtendedRequest } from "../../types/types";

const createRawCategory = async (req: ExtendedRequest, res: Response) => {
  try {
    const { rawCategory } = req.body as { rawCategory: string };

    const newRawCategory = await prisma.rawCategory.create({
      data: {
        name: rawCategory,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      rawCategory: newRawCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "createRawCategory function",
        },
      ],
    });
  }
};

const getAllRawCategory = async (req: ExtendedRequest, res: Response) => {
  try {
    const allRawCategory = await prisma.rawCategory.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All Rawcategory",
      allRawCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "getAllRawCategory function",
        },
      ],
    });
  }
};

const deleteRawCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rawCategory = await prisma.rawCategory.delete({
      where: {
        id: id as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Raw Category deleted successfully",
      rawCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
          path: "server",
          location: "deleteRawCategory function",
        },
      ],
    });
  }
};

const updateRawCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rawCategory } = req.body as { rawCategory: string };

    const updatedRawCategory = await prisma.rawCategory.update({
      where: {
        id: id as string,
      },
      data: {
        name: rawCategory,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Raw Category updated successfully",
      updatedRawCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
        },
      ],
    });
  }
};
const getSingleRawCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rawCategory = await prisma.rawCategory.findUnique({
      where: {
        id: id as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Raw Category",
      rawCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [
        {
          type: "server error",
          value: "",
          msg: "Internal server error",
        },
      ],
    });
  }
};

export {
  createRawCategory,
  getAllRawCategory,
  deleteRawCategory,
  updateRawCategory,
  getSingleRawCategory,
};
