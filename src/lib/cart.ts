export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
};

export const CART_KEY = "as_cart";
