import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStored = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsStored) setProducts(JSON.parse(productsStored));
    }

    loadProducts();
  }, []);

  const addProductsToAsyncStorage = useCallback(
    async (addProducts: Product[]): Promise<void> => {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(addProducts),
      );
    },
    [],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(product => {
        if (product.id !== id) {
          return product;
        }

        const productUpdated = product;
        productUpdated.quantity += 1;

        return productUpdated;
      });

      setProducts(productsUpdated);
      await addProductsToAsyncStorage(productsUpdated);
    },
    [products, addProductsToAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const productsUpdated = products
        .map(product => {
          if (product.id !== id) {
            return product;
          }

          const productUpdated = product;
          productUpdated.quantity -= 1;

          return productUpdated;
        })
        .filter(product => product.quantity > 0);

      setProducts(productsUpdated);
      await addProductsToAsyncStorage(productsUpdated);
    },
    [products, addProductsToAsyncStorage],
  );

  const addToCart = useCallback(
    async product => {
      const addProduct: Product = {
        id: product.id,
        image_url: product.image_url,
        price: product.price,
        quantity: 1,
        title: product.title,
      };

      const productAdded = products.find(p => p.id === addProduct.id);

      if (!productAdded) {
        const addProducts = [...products, addProduct];
        setProducts(addProducts);
        await addProductsToAsyncStorage(addProducts);
      } else {
        await increment(productAdded.id);
      }
    },
    [products, increment, addProductsToAsyncStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
