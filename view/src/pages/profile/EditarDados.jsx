import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../core/api";
import {
  getCurrentStore,
  getCurrentUser,
  saveAuth,
} from "../../utils/auth";

function getPerfilStorageKey(currentStore, currentUser) {
  if (currentStore) return `perfil_loja_${currentStore.id || "atual"}`;
  return `perfil_usuario_${currentUser?.id || "atual"}`;
}

export default function EditarDados() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const [currentStore] = useState(() => getCurrentStore());

  const perfilStorageKey = useMemo(
    () => getPerfilStorageKey(currentStore, currentUser),
    [currentStore, currentUser]
  );

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      setErro("");

      try {
        const dadosLocal = JSON.parse(
          localStorage.getItem(perfilStorageKey) ||
            localStorage.getItem("perfil") ||
            "{}"
        );

        setNome(
          dadosLocal.nome ||
            dadosLocal.nome_empresa ||
            currentStore?.nome_empresa ||
            currentUser?.nome ||
            ""
        );

        setTelefone(
          dadosLocal.telefone ||
            dadosLocal.numero ||
            currentStore?.telefone ||
            currentUser?.numero ||
            ""
        );

        setEmail(
          dadosLocal.email ||
            currentStore?.email ||
            currentUser?.email ||
            ""
        );

        setBio(dadosLocal.bio || currentStore?.bio || currentUser?.bio || "");

        if (currentStore) {
          const { data } = await api.get("/empresa/me");
          setNome(data?.nome_empresa || "");
          setTelefone(data?.telefone || "");
          setEmail(data?.email || "");
          setBio(data?.bio || "");

          const atualizado = {
            ...dadosLocal,
            nome: data?.nome_empresa || "",
            telefone: data?.telefone || "",
            email: data?.email || "",
            bio: data?.bio || "",
          };

          localStorage.setItem(perfilStorageKey, JSON.stringify(atualizado));
          localStorage.setItem("perfil", JSON.stringify(atualizado));
        } else if (currentUser) {
          const { data } = await api.get("/usuario/me");
          setNome(data?.nome || "");
          setTelefone(data?.numero || "");
          setEmail(data?.email || "");
          setBio(data?.bio || "");

          const atualizado = {
            ...dadosLocal,
            nome: data?.nome || "",
            telefone: data?.numero || "",
            email: data?.email || "",
            bio: data?.bio || "",
          };

          localStorage.setItem(perfilStorageKey, JSON.stringify(atualizado));
          localStorage.setItem("perfil", JSON.stringify(atualizado));
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [perfilStorageKey, currentStore, currentUser]);

  async function salvar() {
    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("Preencha o nome.");
      return;
    }

    const dadosAtualizados = {
      nome,
      telefone,
      email,
      bio,
    };

    const perfilAtual = JSON.parse(
      localStorage.getItem(perfilStorageKey) ||
        localStorage.getItem("perfil") ||
        "{}"
    );

    localStorage.setItem(
      perfilStorageKey,
      JSON.stringify({ ...perfilAtual, ...dadosAtualizados })
    );
    localStorage.setItem(
      "perfil",
      JSON.stringify({ ...perfilAtual, ...dadosAtualizados })
    );

    setSalvando(true);

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const token = auth.access_token || localStorage.getItem("token");

      if (currentStore) {
        const { data } = await api.put("/empresa/me", {
          nome_empresa: nome,
          telefone,
          email,
          bio,
        });

        saveAuth({
          ...auth,
          empresa: {
            ...currentStore,
            ...data,
            nome_empresa: data?.nome_empresa ?? nome,
            telefone: data?.telefone ?? telefone,
            email: data?.email ?? email,
            bio: data?.bio ?? bio,
          },
          access_token: token,
        });
      } else if (currentUser) {
        const { data } = await api.put("/usuario/me", {
          nome,
          numero: telefone,
          email,
          bio,
        });

        saveAuth({
          ...auth,
          usuario: {
            ...currentUser,
            ...data,
            nome: data?.nome ?? nome,
            numero: data?.numero ?? telefone,
            email: data?.email ?? email,
            bio: data?.bio ?? bio,
          },
          access_token: token,
        });
      }

      setSucesso("Dados salvos com sucesso.");
      setTimeout(() => navigate(-1), 700);
    } catch (e) {
      console.error("Erro ao salvar dados:", e);
      setSucesso("Salvo localmente. O banco não respondeu agora.");
    } finally {
      setSalvando(false);
    }
  }

  const cardClass =
    "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]";
  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-[#0F172A]/80 px-4 py-3 text-sm text-[#CBD5E1] placeholder:text-slate-500 outline-none transition focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30";
  const labelClass =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#CBD5E1] pb-36">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F19]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <span className="material-icons text-lg">arrow_back</span>
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-[#3B82F6]/25 to-[#14B8A6]/15">
              <span className="material-icons text-2xl text-[#14B8A6]">
                badge
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                {currentStore ? "Dados da Loja" : "Dados Pessoais"}
              </h1>
              <p className="text-sm text-slate-400">
                Edite suas informações principais.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5">
        <div className={`${cardClass} p-5`}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">
              Informações básicas
            </h2>
            <p className="text-sm text-slate-400">
              {loading ? "Carregando dados..." : "Atualize os dados exibidos no app."}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                {currentStore ? "Nome da loja" : "Nome"}
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={inputClass}
                placeholder={currentStore ? "Nome da loja" : "Seu nome"}
              />
            </div>

            <div>
              <label className={labelClass}>Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={inputClass}
                placeholder="(87) 9 9999-9999"
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="seuemail@email.com"
                type="email"
              />
            </div>

            <div>
              <label className={labelClass}>
                {currentStore ? "Descrição da loja" : "Bio"}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`${inputClass} min-h-[120px] resize-none`}
                placeholder={
                  currentStore
                    ? "Fale um pouco sobre a loja"
                    : "Escreva algo curto sobre você"
                }
              />
            </div>
          </div>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {sucesso}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl p-4">
          <button
            onClick={salvar}
            disabled={salvando}
            className="w-full rounded-2xl bg-[#3B82F6] py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-70"
          >
            {salvando ? "Salvando..." : "Salvar dados"}
          </button>
        </div>
      </div>
    </div>
  );
}
