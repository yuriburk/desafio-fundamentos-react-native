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
      const productsAdded = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsAdded) {
        setProducts(JSON.parse(productsAdded));
      }
    }

    loadProducts();
  }, []);

  const saveProducts = useCallback(async productsAdded => {
    setProducts(productsAdded);
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(productsAdded),
    );
  }, []);

  const increment = useCallback(
    async id => {
      const productsAdded = products.map(prod => {
        if (prod.id === id) {
          const productUpdated = prod;
          productUpdated.quantity += 1;
          return productUpdated;
        }

        return prod;
      });

      saveProducts(productsAdded);
    },
    [products, saveProducts],
  );

  const decrement = useCallback(
    async id => {
      const productsAdded = products
        .map(prod => {
          if (prod.id === id) {
            const productUpdated = prod;
            productUpdated.quantity -= 1;
            return productUpdated;
          }

          return prod;
        })
        .filter(prod => prod.quantity > 0);

      saveProducts(productsAdded);
    },
    [products, saveProducts],
  );

  const addToCart = useCallback(
    async product => {
      const productAdded = products.find(prod => prod.id === product.id);

      if (productAdded) {
        increment(productAdded.id);
      } else {
        await saveProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [increment, products, saveProducts],
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
