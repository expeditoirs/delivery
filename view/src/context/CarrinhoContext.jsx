import { createContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser } from "../utils/auth";

export const CarrinhoContext = createContext();

function getCarrinhoKey() {
  const usuario = getCurrentUser();
  return usuario ? `carrinho:user:${usuario.id}` : "carrinho:guest";
}

function gerarLinhaKey(item) {
  return JSON.stringify({
    id: item.id,
    tamanho: item.tamanho || null,
    sabores: item.sabores || [],
    obs: item.obs || "",
  });
}

export function CarrinhoProvider({ children }) {
  const carrinhoKey = useMemo(() => getCarrinhoKey(), []);
  const [carrinho, setCarrinho] = useState([]);

  useEffect(() => {
    const salvo = localStorage.getItem(carrinhoKey);
    if (salvo) {
      try {
        setCarrinho(JSON.parse(salvo));
      } catch {
        setCarrinho([]);
      }
    } else {
      setCarrinho([]);
    }
  }, [carrinhoKey]);

  useEffect(() => {
    localStorage.setItem(carrinhoKey, JSON.stringify(carrinho));
  }, [carrinho, carrinhoKey]);

  function adicionar(item) {
    const linhaKey = gerarLinhaKey(item);

    setCarrinho((prev) => {
      if (prev.length && prev[0].id_empresa !== item.id_empresa) {
        return [{ ...item, qtd: item.qtd || 1, linhaKey }];
      }

      const existe = prev.find((i) => i.linhaKey === linhaKey);
      if (existe) {
        return prev.map((i) =>
          i.linhaKey === linhaKey ? { ...i, qtd: i.qtd + (item.qtd || 1) } : i
        );
      }

      return [...prev, { ...item, qtd: item.qtd || 1, linhaKey }];
    });
  }

  function remover(linhaKey) {
    setCarrinho((prev) => prev.filter((i) => i.linhaKey !== linhaKey));
  }

  function aumentar(linhaKey) {
    setCarrinho((prev) =>
      prev.map((i) =>
        i.linhaKey === linhaKey ? { ...i, qtd: i.qtd + 1 } : i
      )
    );
  }

  function diminuir(linhaKey) {
    setCarrinho((prev) =>
      prev
        .map((i) =>
          i.linhaKey === linhaKey ? { ...i, qtd: i.qtd - 1 } : i
        )
        .filter((i) => i.qtd > 0)
    );
  }

  function limpar() {
    setCarrinho([]);
  }

  return (
    <CarrinhoContext.Provider
      value={{ carrinho, adicionar, remover, aumentar, diminuir, limpar, gerarLinhaKey }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}
