export interface ProductModel {
  id: string;
  title: string;
  image_url: string;
  price: number;
}

export interface ProductModelComplete extends ProductModel {
  quantity: number;
}
