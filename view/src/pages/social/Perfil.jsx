import { useState } from "react";
import api from "../../core/api";
import { clearAuth, getCurrentStore, getCurrentUser, saveAuth } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentStore = getCurrentStore();

  const perfilStorageKey = currentStore
    ? `perfil_loja_${currentStore.id || "atual"}`
    : `perfil_usuario_${currentUser?.id || "atual"}`;

  const dadosSalvos = JSON.parse(localStorage.getItem(perfilStorageKey) || "{}");

  const [nome, setNome] = useState(
    dadosSalvos.nome ||
      (currentStore ? currentStore.nome_empresa : currentUser?.nome) ||
      ""
  );

  const [telefone, setTelefone] = useState(
    dadosSalvos.telefone ||
      currentStore?.telefone ||
      currentUser?.numero ||
      ""
  );

  const [endereco, setEndereco] = useState(
    dadosSalvos.endereco ||
      currentStore?.endereco ||
      currentUser?.endereco ||
      ""
  );

  const [numero, setNumero] = useState(
    dadosSalvos.numero ||
      currentStore?.numero ||
      currentUser?.numero_endereco ||
      ""
  );

  const [bairro, setBairro] = useState(
    dadosSalvos.bairro ||
      currentStore?.bairro ||
      currentUser?.bairro ||
      ""
  );

  const [complemento, setComplemento] = useState(
    dadosSalvos.complemento ||
      currentStore?.complemento ||
      currentUser?.complemento ||
      ""
  );

  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    const perfilLocal = {
      nome,
      telefone,
      endereco,
      numero,
      bairro,
      complemento,
    };

    localStorage.setItem(perfilStorageKey, JSON.stringify(perfilLocal));

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const token = auth.access_token || localStorage.getItem("token");

      if (currentStore) {
        const { data } = await api.put("/empresa/me", {
          nome_empresa: nome,
          telefone,
          endereco,
          numero,
          bairro,
          complemento,
        });

        saveAuth({
          ...auth,
          empresa: {
            ...currentStore,
            ...data,
            nome_empresa: data?.nome_empresa ?? nome,
            telefone: data?.telefone ?? telefone,
            endereco: data?.endereco ?? endereco,
            numero: data?.numero ?? numero,
            bairro: data?.bairro ?? bairro,
            complemento: data?.complemento ?? complemento,
          },
          access_token: token,
        });
      } else if (currentUser) {
        const { data } = await api.put("/usuario/me", {
          nome,
          numero: telefone,
          endereco,
          numero_endereco: numero,
          bairro,
          complemento,
        });

        saveAuth({
          ...auth,
          usuario: {
            ...currentUser,
            ...data,
            nome: data?.nome ?? nome,
            numero: data?.numero ?? telefone,
            endereco: data?.endereco ?? endereco,
            numero_endereco: data?.numero_endereco ?? numero,
            bairro: data?.bairro ?? bairro,
            complemento: data?.complemento ?? complemento,
          },
          access_token: token,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }

    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <div className="bg-gray-50 min-h-full pb-36">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
            <span className="material-icons text-red-400 text-2xl">person</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {currentStore ? "Perfil da Loja" : "Meu Perfil"}
            </h1>
            <p className="text-xs text-gray-400">
              {currentStore ? "Dados básicos do estabelecimento" : "Dados pessoais e endereço"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Dados principais</h2>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {currentStore ? "Nome da loja" : "Nome completo"}
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm bg-white"
              placeholder="Nome"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Telefone
            </label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm bg-white"
              placeholder="(87) 9 9999-9999"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Endereço</h2>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Rua
            </label>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm bg-white"
              placeholder="Nome da rua"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Número
              </label>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm bg-white"
                placeholder="123"
              />
            </div>

            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Bairro
              </label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm bg-white"
                placeholder="Centro"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Complemento
            </label>
            <input
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 mt-1.5 text-sm bg-white"
              placeholder="Casa, apto..."
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-100 space-y-3">
        {salvo && (
          <div className="text-center text-sm text-green-600 font-medium">
            Dados salvos com sucesso.
          </div>
        )}

        <button
          onClick={salvar}
          className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-base"
        >
          Salvar dados
        </button>

        <button
          onClick={() => {
            clearAuth();
            navigate("/login");
          }}
          className="w-full text-gray-400 text-sm"
        >
          Sair
        </button>
      </div>
    </div>
  );
}