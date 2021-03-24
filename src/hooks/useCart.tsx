import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyInCart = cart.find(product => product.id === productId);

      if (!productAlreadyInCart) {
        const { data: product } = await api.get(`products/${productId}`);
        const { data: stock } = await api.get(`stock/${productId}`);

        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        setCart([...cart, {...product, amount: 1}]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      } else {
        const { data: stock } = await api.get(`stock/${productId}`);
        if (productAlreadyInCart.amount < stock.amount) {
          const updatedCart = cart.map(product => {
            return (product.id === productId) ? {...product, amount: product.amount + 1} : product;
          });

          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          toast('Adicionado');
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`);
      if (amount <= 0) {
        removeProduct(productId);
        return;
      }
      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const updatedCart = cart.map(product => {
          return (product.id === productId) ? {...product, amount: product.amount - 1} : product;
        });

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
