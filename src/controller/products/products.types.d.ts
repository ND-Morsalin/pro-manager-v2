import { DiscountType, PaymentType } from "@prisma/client";

export interface AddProductsPayload {
      productName: string;
      stokeAmount: number;
      buyingPrice: number;
      sellingPrice: number;
      categoryId: string;
      productBrand: string;
      unit: string;
      supplierId?: string;
      paidAmount?: number;
      discount?: number;
      paymentType?: PaymentType;
      cost?: number;
      discountType:DiscountType
    }

    
// export enum DiscountType {
//   FLAT,
//   PERCENTAGE
// }

// export enum PaymentType {
//   CASH,
//   BANK_CHEQUE
// }