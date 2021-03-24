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
        const { data: product } = await api.get<Product>(`products/${productId}`);
        const { data: stock } = await api.get<Stock>(`stock/${productId}`);

        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        setCart([...cart, {...product, amount: 1}]);
        console.log(cart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]));
        return;
      }

      if (productAlreadyInCart) {
        const { data: stock } = await api.get(`stock/${productId}`);
        if (productAlreadyInCart.amount < stock.amount) {
          const updatedCart = cart.map(product => {
            return (product.id === productId) ? {...product, amount: product.amount + 1} : product;
          });

          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
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
      const productExists = cart.some(product => product.id === productId);
      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const updatedCart = cart.filter(product => product.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`);
      if (amount < 1) return;

      if (!(cart.some(product => product.id === productId))) return;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const updatedCart = cart.map(product => {
          return (product.id === productId) ? {...product, amount: amount} : product;
        });

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
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
