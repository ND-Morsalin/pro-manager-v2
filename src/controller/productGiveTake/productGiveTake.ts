import { Response } from "express";
import { ExtendedRequest, ProductGiveBodyType } from "../../types/types";
import prisma from "../../utility/prisma";

const createProductGive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { productId, amount, customerId, companyName, note } =
      req.body as ProductGiveBodyType;
    const productGive = await prisma.productGive.create({
      data: {
        amount,
        customerId,
        productId,
        shopOwnerId: req.shopOwner.id,
        companyName: companyName || "",
        note: note || "",
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // reduce product stock
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        stokeAmount: {
          decrement: amount,
        },
      },
    });

    return res.status(200).json({ productGive, product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createProductReceive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { productId, amount, customerId, companyName, note } =
      req.body as ProductGiveBodyType;
    const productTake = await prisma.productReceive.create({
      data: {
        amount,
        customerId,
        productId,
        shopOwnerId: req.shopOwner.id,
        companyName: companyName || "",
        note: note || "",
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // increase product stock
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        stokeAmount: {
          increment: amount,
        },
      },
    });

    return res.status(200).json({ productTake, product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProductGive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productGive = await prisma.productGive.delete({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({ productGive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProductReceive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productReceive = await prisma.productReceive.delete({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
    });

    return res.status(200).json({ productReceive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductGive = async (req: ExtendedRequest, res: Response) => {
  try {
    const productGive = await prisma.productGive.findMany({
      where: {
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        product: true,
        customer: true,
      },
    });
    return res.status(200).json({ productGive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const getProductReceive = async (req: ExtendedRequest, res: Response) => {
  try {
    const productReceive = await prisma.productReceive.findMany({
      include: {
        product: true,
        customer: true,
      },
      where: {
        shopOwnerId: req.shopOwner.id,
      },
    });
    return res.status(200).json({ productReceive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSingleProductGive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productGive = await prisma.productGive.findUnique({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        product: true,
        customer: true,
      },
    });
    return res.status(200).json({ productGive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSingleProductReceive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productReceive = await prisma.productReceive.findUnique({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
      include: {
        product: true,
        customer: true,
      },
    });
    return res.status(200).json({ productReceive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateProductGive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, customerId, productId,companyName,note } = req.body as ProductGiveBodyType;
    const productGive = await prisma.productGive.update({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        amount,
        customerId,
        productId,
        companyName,
        note,
      },
      include: {
        product: true,
        customer: true,
      },
    });
    return res.status(200).json({ productGive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProductReceive = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, customerId, productId, companyName,note } = req.body as ProductGiveBodyType;
    const productReceive = await prisma.productReceive.update({
      where: {
        id,
        shopOwnerId: req.shopOwner.id,
      },
      data: {
        amount,
        customerId,
        productId,
        companyName,
        note,
      },
      include: {
        product: true,
        customer: true,
      },
    });
    return res.status(200).json({ productReceive });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createProductGive,
  createProductReceive,
  deleteProductGive,
  deleteProductReceive,
  getProductGive,
  getProductReceive,
  getSingleProductGive,
  getSingleProductReceive,
  updateProductGive,
  updateProductReceive,
};
