import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../core/api';
import StoreProductForm from '../../features/store/components/StoreProductForm';
import {
  createInitialForm,
  buildConfiguracao,
  getPrecoPrincipalFromTamanhos,
  getResumoHorario,
  getTamanhosValidos,
} from '../../features/store/components/storeUtils';
import { getCurrentStore } from '../../utils/auth';

export default function CadastrarProdutos() {
  const navigate = useNavigate();
  const [store] = useState(() => getCurrentStore());

  const [empresa, setEmpresa] = useState(store || null);
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState(createInitialForm());

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const categoriaSelecionada = useMemo(
    () => categorias.find((c) => String(c.id) === String(form.id_categoria)),
    [categorias, form.id_categoria]
  );

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300';
  const labelClass =
    'text-xs font-semibold text-gray-500 uppercase tracking-wide';
  const cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4';

  useEffect(() => {
    if (!store) {
      navigate('/login');
      return;
    }

    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      setErro('');

      try {
        const [empresaRes, categoriasRes, itensRes] = await Promise.allSettled([
          api.get('/empresa/me'),
          api.get('/categoria/', { params: { empresa_id: store.id } }),
          api.get(`/empresa/${store.id}/itens`),
        ]);

        if (!ativo) return;

        if (empresaRes.status === 'fulfilled') {
          setEmpresa(empresaRes.value.data);
        } else {
          navigate('/login');
          return;
        }

        if (categoriasRes.status === 'fulfilled') {
          setCategorias(categoriasRes.value.data || []);
        }

        if (itensRes.status === 'fulfilled') {
          setItens(itensRes.value.data || []);
        }
      } catch (error) {
        console.error(error);
        if (ativo) {
          setErro('Não foi possível carregar os dados para cadastro.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [navigate, store]);

  function resetForm() {
    setForm(createInitialForm());
  }

  async function cadastrarItem(e) {
    e.preventDefault();
    if (!store) return;

    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const tamanhosValidos = getTamanhosValidos(form.tamanhos);
      const usaTamanhos = form.tipo_produto === 'pizza' || Boolean(form.usar_tamanhos);

      if (!form.id_categoria) {
        throw new Error('Selecione a categoria do produto.');
      }

      if (!form.nome.trim()) {
        throw new Error('Informe o nome do produto.');
      }

      if (usaTamanhos && !tamanhosValidos.length) {
        throw new Error('Cadastre pelo menos um tamanho com preço.');
      }

      if (!usaTamanhos && String(form.preco_fixo).trim() === '') {
        throw new Error('Informe o preço fixo do produto.');
      }

      const gruposSabores = (form.grupos_opcoes || []).filter(
        (g) => g.tipo_grupo === 'sabores'
      );

      for (const grupo of gruposSabores) {
        if (Number(grupo.max) < 1) {
          throw new Error(
            'Grupo de sabores precisa permitir pelo menos 1 seleção.'
          );
        }

        if (Number(grupo.min) > Number(grupo.max)) {
          throw new Error(
            'No grupo de sabores, o mínimo não pode ser maior que o máximo.'
          );
        }
      }

      if (form.tipo_produto === 'pizza' && !gruposSabores.length) {
        throw new Error('Pizza precisa de pelo menos um grupo de sabores.');
      }

      if (form.usarControleHorario) {
        const possuiDiaValido = form.horarios.some(
          (d) => d.ativo && d.abertura && d.fechamento
        );

        if (!possuiDiaValido) {
          throw new Error(
            'Selecione pelo menos um dia com horário de abertura e fechamento.'
          );
        }
      }

      const payload = {
        id_empresa: store.id,
        id_categoria: Number(form.id_categoria),
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        preco: getPrecoPrincipalFromTamanhos(tamanhosValidos, form.preco_fixo),
        disponibilidade_horarios: getResumoHorario(form),
        tipo_produto: form.tipo_produto || 'normal',
        configuracao: buildConfiguracao({
          ...form,
          tamanhos: tamanhosValidos,
        }),
        img: null,
      };

      const { data } = await api.post(`/empresa/${store.id}/itens`, payload);

      setItens((prev) => [data, ...prev]);
      setSucesso('Produto cadastrado com sucesso.');
      resetForm();
    } catch (error) {
      console.error(error);
      setErro(error?.message || 'Não foi possível cadastrar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  if (!store) return null;

  if (carregando) {
    return (
      <div className="bg-gray-50 min-h-full pb-24">
        <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">
            Cadastrar Produtos
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Carregando informações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Cadastrar Produtos
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Cadastre novos produtos da loja de forma separada do painel.
            </p>
            {empresa?.nome_empresa && (
              <p className="text-xs text-gray-500 mt-2">
                Loja: {empresa.nome_empresa}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/loja')}
            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
            {sucesso}
          </div>
        )}

        {categoriaSelecionada && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Categoria selecionada: <strong>{categoriaSelecionada.nome}</strong>
          </div>
        )}

        <StoreProductForm
          form={form}
          setForm={setForm}
          categorias={categorias}
          cadastrarItem={cadastrarItem}
          resetForm={resetForm}
          salvando={salvando}
          cardClass={cardClass}
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">
              Produtos cadastrados
            </h2>
            <span className="text-sm text-gray-500">{itens.length} item(ns)</span>
          </div>

          {!itens.length ? (
            <p className="text-sm text-gray-500">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-xl p-3 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.nome}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.descricao || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="text-sm font-bold text-green-600">
                      R$ {Number(item.preco || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
