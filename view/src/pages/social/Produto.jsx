import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../core/api";
import { CarrinhoContext } from "../../context/CarrinhoContext";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getFlavorGroup(configuracao) {
  const grupos = configuracao?.grupos_opcoes || [];
  const grupoAtual = grupos.find((grupo) => grupo.tipo_grupo === "sabores");
  if (grupoAtual) return grupoAtual;

  if ((configuracao?.sabores_disponiveis || []).length) {
    return {
      nome: "Sabores",
      tipo_grupo: "sabores",
      min: configuracao?.sabores?.min || 1,
      max: configuracao?.sabores?.max || 2,
      regra_preco: "maior_preco",
      itens: configuracao.sabores_disponiveis.map((nome) => ({ nome, preco: 0 })),
    };
  }

  return null;
}

function getFlavorPrice(option, size) {
  const sizeName = size?.nome;
  if (sizeName && option?.precos_por_tamanho?.[sizeName] != null) {
    return Number(option.precos_por_tamanho[sizeName] || 0);
  }
  if (option?.preco != null) {
    return Number(option.preco || 0);
  }
  return Number(size?.preco || 0);
}

function SectionHeader({ title, subtitle, required, counter, status }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-theme-text">{title}</h2>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              required
                ? "bg-[#F97316]/10 text-[#F97316]"
                : "bg-theme-hover text-theme-muted"
            }`}
          >
            {required ? "Obrigatório" : "Opcional"}
          </span>
        </div>
        {subtitle ? <p className="mt-1 text-xs text-theme-muted">{subtitle}</p> : null}
      </div>
      {counter ? (
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            status === "ok"
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-theme-hover text-theme-muted"
          }`}
        >
          {counter}
        </span>
      ) : null}
    </div>
  );
}

function OptionCard({ active, onClick, title, subtitle, priceLabel, icon = "radio_button_unchecked" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-theme-primary bg-theme-primary/10"
          : "border-theme-border bg-theme-surface hover:bg-theme-hover"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`material-icons text-base ${active ? "text-theme-primary" : "text-theme-muted"}`}>
              {active ? "check_circle" : icon}
            </span>
            <span className="truncate font-semibold text-theme-text">{title}</span>
          </div>
          {subtitle ? <p className="mt-1 pl-6 text-xs text-theme-muted">{subtitle}</p> : null}
        </div>
        {priceLabel ? <span className="shrink-0 text-sm font-bold text-theme-primary">{priceLabel}</span> : null}
      </div>
    </button>
  );
}

export default function FinalProduto() {
  const { adicionar } = useContext(CarrinhoContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");
  const [tamanhoSelecionadoNome, setTamanhoSelecionadoNome] = useState("");
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState({});
  const [gruposSelecionados, setGruposSelecionados] = useState({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get(`/item/${id}`)
      .then((res) => setProduto(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const configuracao = useMemo(() => produto?.configuracao || {}, [produto]);
  const tamanhos = useMemo(() => configuracao.tamanhos || [], [configuracao]);
  const adicionais = useMemo(() => configuracao.adicionais || [], [configuracao]);
  const grupoSabores = useMemo(() => getFlavorGroup(configuracao), [configuracao]);
  const gruposComuns = useMemo(
    () => (configuracao.grupos_opcoes || []).filter((grupo) => grupo.tipo_grupo !== "sabores"),
    [configuracao]
  );

  const tamanhoSelecionado = useMemo(() => {
    if (tamanhos.length) {
      return tamanhos.find((item) => item.nome === tamanhoSelecionadoNome) || tamanhos[0];
    }
    if (!produto) return null;
    return { nome: null, preco: Number(configuracao.preco_fixo ?? produto.preco) };
  }, [configuracao.preco_fixo, produto, tamanhoSelecionadoNome, tamanhos]);

  const minSabores = Number(tamanhoSelecionado?.min_sabores || grupoSabores?.min || 0);
  const maxSabores = Number(tamanhoSelecionado?.max_sabores || grupoSabores?.max || 0);

  function toggleSabor(option) {
    setSaboresSelecionados((prev) => {
      const exists = prev.some((item) => item.nome === option.nome);
      if (exists) return prev.filter((item) => item.nome !== option.nome);
      if (maxSabores && prev.length >= maxSabores) return prev;
      return [...prev, option];
    });
    setErro("");
  }

  function changeAdicional(option, delta) {
    setAdicionaisSelecionados((prev) => {
      const current = Number(prev[option.nome]?.quantidade || 0);
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (!next) {
        delete updated[option.nome];
        return updated;
      }
      updated[option.nome] = {
        nome: option.nome,
        preco: Number(option.preco || 0),
        quantidade: next,
      };
      return updated;
    });
  }

  function toggleGrupoOpcao(grupo, item) {
    setGruposSelecionados((prev) => {
      const current = prev[grupo.nome] || [];
      const exists = current.some((selected) => selected.nome === item.nome);
      if (exists) {
        return {
          ...prev,
          [grupo.nome]: current.filter((selected) => selected.nome !== item.nome),
        };
      }
      if (Number(grupo.max || 1) <= 1) {
        return {
          ...prev,
          [grupo.nome]: [{ nome: item.nome, preco: Number(item.preco || 0) }],
        };
      }
      if (current.length >= Number(grupo.max || current.length + 1)) {
        return prev;
      }
      return {
        ...prev,
        [grupo.nome]: [...current, { nome: item.nome, preco: Number(item.preco || 0) }],
      };
    });
    setErro("");
  }

  const adicionaisLista = useMemo(
    () => Object.values(adicionaisSelecionados).filter((item) => item.quantidade > 0),
    [adicionaisSelecionados]
  );

  const gruposLista = useMemo(
    () =>
      Object.entries(gruposSelecionados)
        .map(([grupo_nome, itens]) => ({ grupo_nome, itens }))
        .filter((grupo) => grupo.itens?.length),
    [gruposSelecionados]
  );

  const precoBase = useMemo(() => {
    if (!produto) return 0;
    if (grupoSabores && saboresSelecionados.length) {
      const precos = saboresSelecionados.map((option) => getFlavorPrice(option, tamanhoSelecionado));
      if (grupoSabores.regra_preco === "soma_proporcional") {
        return precos.reduce((acc, value) => acc + value, 0) / precos.length;
      }
      return Math.max(...precos);
    }
    if (tamanhoSelecionado?.preco != null) {
      return Number(tamanhoSelecionado.preco || 0);
    }
    return Number(configuracao.preco_fixo ?? produto.preco ?? 0);
  }, [configuracao.preco_fixo, grupoSabores, produto, saboresSelecionados, tamanhoSelecionado]);

  const adicionaisTotal = useMemo(
    () => adicionaisLista.reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 0), 0),
    [adicionaisLista]
  );

  const gruposTotal = useMemo(
    () => gruposLista.reduce((acc, grupo) => acc + grupo.itens.reduce((sum, item) => sum + Number(item.preco || 0), 0), 0),
    [gruposLista]
  );

  const precoUnitario = Number((precoBase + adicionaisTotal + gruposTotal).toFixed(2));
  const total = precoUnitario * qtd;

  const pendencias = useMemo(() => {
    const missing = [];
    if (tamanhos.length && !tamanhoSelecionado) {
      missing.push("Escolha um tamanho");
    }
    if (grupoSabores && (saboresSelecionados.length < minSabores || saboresSelecionados.length > maxSabores)) {
      missing.push(`Selecione ${minSabores}${maxSabores && minSabores !== maxSabores ? ` a ${maxSabores}` : ""} sabor(es)`);
    }
    gruposComuns.forEach((grupo) => {
      const selecionados = gruposSelecionados[grupo.nome] || [];
      const minimo = Number(grupo.min || 0);
      if (minimo && selecionados.length < minimo) {
        missing.push(`${grupo.nome}: selecione ${minimo}`);
      }
    });
    return missing;
  }, [grupoSabores, gruposComuns, gruposSelecionados, maxSabores, minSabores, saboresSelecionados.length, tamanhoSelecionado, tamanhos.length]);

  const podeAdicionar = pendencias.length === 0;

  function adicionarItem() {
    setErro("");
    if (!podeAdicionar) {
      setErro(pendencias[0] || "Revise a montagem do item.");
      return;
    }

    adicionar({
      ...produto,
      qtd,
      obs,
      preco: precoUnitario,
      tamanho: tamanhoSelecionado?.nome || null,
      sabores: saboresSelecionados.map((item) => item.nome),
      adicionais: adicionaisLista,
      grupos: gruposLista,
      empresa: produto.empresa_nome || "Empresa",
    });
    navigate(-1);
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] flex-col animate-pulse bg-theme-background">
        <div className="h-56 flex-shrink-0 bg-theme-surface" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-2/3 rounded-full bg-theme-secondary/50" />
          <div className="h-3 w-full rounded-full bg-theme-hover" />
          <div className="h-3 w-3/4 rounded-full bg-theme-hover" />
          <div className="mt-2 h-5 w-1/3 rounded-full bg-theme-secondary/50" />
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex flex-col items-center justify-center bg-theme-background py-20 text-theme-muted">
        <span className="material-icons mb-3 text-5xl">error_outline</span>
        <p className="text-sm font-medium">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-theme-background">
      <div className="relative flex-shrink-0">
        <div className="flex h-56 items-center justify-center border-b border-theme-border bg-gradient-to-br from-theme-secondary via-theme-surface to-theme-background">
          <span className="material-icons text-[96px] text-theme-accent">fastfood</span>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-theme-border bg-theme-surface shadow-md"
        >
          <span className="material-icons text-theme-text">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-40">
        <div className="rounded-3xl border border-theme-border bg-theme-surface p-4">
          <h1 className="text-xl font-bold text-theme-text">{produto.nome}</h1>
          {produto.descricao ? (
            <p className="mt-1 text-sm leading-relaxed text-theme-muted">{produto.descricao}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-muted">Preço atual</p>
              <p className="mt-1 text-2xl font-bold text-theme-primary">{money(precoUnitario)}</p>
            </div>
            {!podeAdicionar ? (
              <div className="rounded-2xl bg-[#F97316]/10 px-3 py-2 text-right text-xs text-[#F97316]">
                {pendencias.length} pendência(s)
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-right text-xs text-emerald-500">
                Pronto para adicionar
              </div>
            )}
          </div>
        </div>

        {tamanhos.length > 0 && (
          <section className="rounded-3xl border border-theme-border bg-theme-surface p-4">
            <SectionHeader
              title="Tamanho"
              subtitle="Escolha o tamanho base do produto"
              required
              counter={tamanhoSelecionado?.nome || "1 opção"}
              status={tamanhoSelecionado ? "ok" : "pending"}
            />
            <div className="grid grid-cols-1 gap-2">
              {tamanhos.map((tamanho) => {
                const ativo = tamanhoSelecionado?.nome === tamanho.nome;
                const subtitle =
                  grupoSabores && tamanho.max_sabores
                    ? `${Number(tamanho.min_sabores || 1)} a ${Number(tamanho.max_sabores)} sabores`
                    : null;
                return (
                  <OptionCard
                    key={tamanho.nome}
                    active={ativo}
                    onClick={() => setTamanhoSelecionadoNome(tamanho.nome)}
                    title={tamanho.nome}
                    subtitle={subtitle}
                    priceLabel={money(tamanho.preco)}
                    icon="radio_button_unchecked"
                  />
                );
              })}
            </div>
          </section>
        )}

        {grupoSabores && (
          <section className="rounded-3xl border border-theme-border bg-theme-surface p-4">
            <SectionHeader
              title={grupoSabores.nome || "Sabores"}
              subtitle={`Selecione ${minSabores}${maxSabores && minSabores !== maxSabores ? ` a ${maxSabores}` : ""} sabor(es)`}
              required
              counter={`${saboresSelecionados.length}/${maxSabores || minSabores}`}
              status={saboresSelecionados.length >= minSabores && (!maxSabores || saboresSelecionados.length <= maxSabores) ? "ok" : "pending"}
            />
            <div className="grid grid-cols-1 gap-2">
              {(grupoSabores.itens || []).map((option) => {
                const ativo = saboresSelecionados.some((item) => item.nome === option.nome);
                const flavorPrice = getFlavorPrice(option, tamanhoSelecionado);
                const subtitle =
                  grupoSabores.regra_preco === "soma_proporcional"
                    ? "Entra no cálculo proporcional"
                    : "Pode definir o valor final";
                return (
                  <OptionCard
                    key={option.nome}
                    active={ativo}
                    onClick={() => toggleSabor(option)}
                    title={option.nome}
                    subtitle={subtitle}
                    priceLabel={money(flavorPrice)}
                    icon="check_box_outline_blank"
                  />
                );
              })}
            </div>
          </section>
        )}

        {gruposComuns.map((grupo) => {
          const selecionados = gruposSelecionados[grupo.nome] || [];
          const minimo = Number(grupo.min || 0);
          const maximo = Number(grupo.max || 0);
          const singleChoice = maximo <= 1;
          return (
            <section key={grupo.nome} className="rounded-3xl border border-theme-border bg-theme-surface p-4">
              <SectionHeader
                title={grupo.nome}
                subtitle={`Selecione ${minimo || 0}${maximo ? ` até ${maximo}` : ""} opção(ões)`}
                required={Boolean(minimo || grupo.obrigatorio)}
                counter={`${selecionados.length}${maximo ? `/${maximo}` : ""}`}
                status={selecionados.length >= minimo ? "ok" : "pending"}
              />
              <div className="grid grid-cols-1 gap-2">
                {(grupo.itens || []).map((item) => {
                  const ativo = selecionados.some((selected) => selected.nome === item.nome);
                  return (
                    <OptionCard
                      key={item.nome}
                      active={ativo}
                      onClick={() => toggleGrupoOpcao(grupo, item)}
                      title={item.nome}
                      subtitle={singleChoice ? "Escolha única" : "Múltipla escolha"}
                      priceLabel={item.preco ? `+ ${money(item.preco)}` : "Grátis"}
                      icon={singleChoice ? "radio_button_unchecked" : "check_box_outline_blank"}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {adicionais.length > 0 && (
          <section className="rounded-3xl border border-theme-border bg-theme-surface p-4">
            <SectionHeader
              title="Adicionais"
              subtitle="Você pode incluir quantos quiser"
              required={false}
              counter={`${adicionaisLista.reduce((acc, item) => acc + Number(item.quantidade || 0), 0)} selecionado(s)`}
              status={adicionaisLista.length ? "ok" : "pending"}
            />
            <div className="space-y-2">
              {adicionais.map((option) => {
                const quantidade = Number(adicionaisSelecionados[option.nome]?.quantidade || 0);
                return (
                  <div key={option.nome} className="flex items-center justify-between rounded-2xl border border-theme-border bg-theme-background px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-theme-text">{option.nome}</p>
                      <p className="text-xs text-theme-muted">{option.preco ? `+ ${money(option.preco)}` : "Grátis"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeAdicional(option, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-theme-border bg-theme-hover text-theme-text"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-semibold text-theme-text">{quantidade}</span>
                      <button
                        onClick={() => changeAdicional(option, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-primary text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-theme-border bg-theme-surface p-4">
          <SectionHeader
            title="Observações"
            subtitle="Ex.: sem cebola, ponto da carne, retirar molho"
            required={false}
          />
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Alguma instrução especial para este item?"
            rows={3}
            className="w-full resize-none rounded-xl border border-theme-border bg-theme-background p-3 text-sm text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/30"
          />
        </section>

        <section className="rounded-3xl border border-theme-border bg-theme-surface p-4">
          <SectionHeader title="Resumo da montagem" subtitle="Confira antes de adicionar ao carrinho" required={false} />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-theme-muted">Base do produto</span>
              <span className="font-semibold text-theme-text">{money(precoBase)}</span>
            </div>
            {tamanhoSelecionado?.nome ? (
              <div className="flex items-center justify-between">
                <span className="text-theme-muted">Tamanho</span>
                <span className="font-semibold text-theme-text">{tamanhoSelecionado.nome}</span>
              </div>
            ) : null}
            {saboresSelecionados.length ? (
              <div className="flex items-start justify-between gap-3">
                <span className="text-theme-muted">Sabores</span>
                <span className="text-right font-semibold text-theme-text">
                  {saboresSelecionados.map((item) => item.nome).join(", ")}
                </span>
              </div>
            ) : null}
            {adicionaisLista.length ? (
              <div className="flex items-start justify-between gap-3">
                <span className="text-theme-muted">Adicionais</span>
                <span className="text-right font-semibold text-theme-text">
                  {adicionaisLista.map((item) => `${item.nome}${item.quantidade > 1 ? ` x${item.quantidade}` : ""}`).join(", ")}
                </span>
              </div>
            ) : null}
            {gruposLista.map((grupo) => (
              <div key={grupo.grupo_nome} className="flex items-start justify-between gap-3">
                <span className="text-theme-muted">{grupo.grupo_nome}</span>
                <span className="text-right font-semibold text-theme-text">
                  {(grupo.itens || []).map((item) => item.nome).join(", ")}
                </span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-theme-border pt-3">
              <span className="font-semibold text-theme-text">Preço unitário</span>
              <span className="text-lg font-bold text-theme-primary">{money(precoUnitario)}</span>
            </div>
          </div>
        </section>

        {erro ? (
          <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]">
            {erro}
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 border-t border-theme-border bg-theme-surface p-4">
        {!podeAdicionar ? (
          <div className="mb-3 rounded-2xl bg-[#F97316]/10 px-3 py-2 text-xs text-[#F97316]">
            Falta concluir: {pendencias.join(" • ")}
          </div>
        ) : null}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-theme-text">Quantidade</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQtd((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-theme-border bg-theme-hover text-lg font-bold text-theme-text"
            >
              -
            </button>
            <span className="w-6 text-center text-lg font-bold text-theme-text">{qtd}</span>
            <button
              onClick={() => setQtd((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-primary text-lg font-bold text-white"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={adicionarItem}
          className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-bold text-white transition ${
            podeAdicionar
              ? "bg-theme-primary hover:bg-theme-accent"
              : "cursor-not-allowed bg-theme-muted/40"
          }`}
        >
          <span>{qtd}x Adicionar</span>
          <span>{money(total)}</span>
        </button>
      </div>
    </div>
  );
}
