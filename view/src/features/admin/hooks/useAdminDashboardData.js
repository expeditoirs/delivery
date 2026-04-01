import { useCallback, useEffect, useState } from 'react';
import api from '../../../core/api';

const INITIAL_DATA = {
  stats: {},
  empresas: [],
  usuarios: [],
  pedidos: [],
  bairros: [],
  cidades: [],
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

export default function useAdminDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(INITIAL_DATA);
  const [busyKey, setBusyKey] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const reload = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/admin/resumo', {
          params: {
            empresas_limit: 50,
            usuarios_limit: 10,
            pedidos_limit: 20,
          },
        });

        if (active) {
          setData(response.data || INITIAL_DATA);
        }
      } catch (requestError) {
        console.error(requestError);

        if (active) {
          setError('Nao foi possivel carregar o painel administrativo.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshToken]);

  const createBairro = useCallback(async ({ nome, id_cidade }) => {
    setBusyKey('bairro:create');
    setError('');
    try {
      await api.post('/admin/bairros', { nome, id_cidade });
      reload();
      return { ok: true };
    } catch (requestError) {
      console.error(requestError);
      const message = getErrorMessage(requestError, 'Nao foi possivel cadastrar o bairro.');
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyKey('');
    }
  }, [reload]);

  const deleteBairro = useCallback(async (bairroId) => {
    setBusyKey(`bairro:${bairroId}`);
    setError('');
    try {
      await api.delete(`/admin/bairros/${bairroId}`);
      reload();
      return { ok: true };
    } catch (requestError) {
      console.error(requestError);
      const message = getErrorMessage(requestError, 'Nao foi possivel excluir o bairro.');
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyKey('');
    }
  }, [reload]);

  const toggleEmpresaStatus = useCallback(async (empresaId, ativo) => {
    setBusyKey(`empresa:status:${empresaId}`);
    setError('');
    try {
      await api.patch(`/admin/empresas/${empresaId}/status`, { ativo });
      reload();
      return { ok: true };
    } catch (requestError) {
      console.error(requestError);
      const message = getErrorMessage(requestError, 'Nao foi possivel atualizar o status da loja.');
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyKey('');
    }
  }, [reload]);

  const deleteEmpresa = useCallback(async (empresaId) => {
    setBusyKey(`empresa:delete:${empresaId}`);
    setError('');
    try {
      await api.delete(`/admin/empresas/${empresaId}`);
      reload();
      return { ok: true };
    } catch (requestError) {
      console.error(requestError);
      const message = getErrorMessage(requestError, 'Nao foi possivel excluir a loja.');
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyKey('');
    }
  }, [reload]);

  return {
    busyKey,
    createBairro,
    data,
    deleteBairro,
    deleteEmpresa,
    error,
    loading,
    reload,
    toggleEmpresaStatus,
  };
}