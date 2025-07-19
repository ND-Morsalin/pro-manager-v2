import { Request, Response } from "express";
import prisma from "../../utility/prisma";
import { ExtendedRequest } from "../../types/types";

const createCategory = async (req: ExtendedRequest, res: Response) => {
  try {
    const { category } = req.body as { category: string };

    const newCategory = await prisma.category.create({
      data: {
        category,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      category: newCategory,
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
          location: "createCategory function",
        },
      ],
    });
  }
};

const getAllCategory = async (req: ExtendedRequest, res: Response) => {
  try {
    const allCategory = await prisma.category.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All category",
      allCategory,
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
          location: "getAllCategory function",
        },
      ],
    });
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category } = req.body as { category: string };

    const updateCategory = await prisma.category.update({
      where: {
        id: id as string,
      },
      data:{
        category
      }
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      updateCategory,
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
          location: "deleteCategory function",
        },
      ],
    });
  }
};

const getSingleCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
  

    const category = await prisma.category.findUnique({
      where: {
        id: id as string,
      }
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      category,
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
          location: "deleteCategory function",
        },
      ],
    });
  }
};
const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.delete({
      where: {
        id: id as string,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      category,
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
          location: "deleteCategory function",
        },
      ],
    });
  }
};

export { createCategory, getAllCategory, deleteCategory, updateCategory,getSingleCategory };
