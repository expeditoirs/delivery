import { useMemo } from 'react';

const DIAS_SEMANA = [
  { chave: 'domingo', label: 'Domingo' },
  { chave: 'segunda', label: 'Segunda-feira' },
  { chave: 'terca', label: 'Terça-feira' },
  { chave: 'quarta', label: 'Quarta-feira' },
  { chave: 'quinta', label: 'Quinta-feira' },
  { chave: 'sexta', label: 'Sexta-feira' },
  { chave: 'sabado', label: 'Sábado' },
];

function criarHorarioPadrao() {
  return DIAS_SEMANA.map((dia) => ({
    dia: dia.chave,
    label: dia.label,
    ativo: false,
    abertura: '',
    fechamento: '',
  }));
}

export default function LojaHours({
  form,
  setForm,
  cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4',
  inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300',
  labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide',
}) {
  const horarios = useMemo(() => {
    if (Array.isArray(form?.horarios) && form.horarios.length) {
      return form.horarios;
    }
    return criarHorarioPadrao();
  }, [form?.horarios]);

  function atualizarControleHorario(valor) {
    setForm((prev) => ({
      ...prev,
      usarControleHorario: valor,
      horarios:
        Array.isArray(prev.horarios) && prev.horarios.length
          ? prev.horarios
          : criarHorarioPadrao(),
    }));
  }

  function atualizarDia(index, campo, valor) {
    setForm((prev) => {
      const horariosAtualizados = Array.isArray(prev.horarios) && prev.horarios.length
        ? [...prev.horarios]
        : criarHorarioPadrao();

      horariosAtualizados[index] = {
        ...horariosAtualizados[index],
        [campo]: valor,
      };

      return {
        ...prev,
        horarios: horariosAtualizados,
      };
    });
  }

  function alternarDia(index) {
    setForm((prev) => {
      const horariosAtualizados = Array.isArray(prev.horarios) && prev.horarios.length
        ? [...prev.horarios]
        : criarHorarioPadrao();

      const diaAtual = horariosAtualizados[index];
      const novoAtivo = !diaAtual.ativo;

      horariosAtualizados[index] = {
        ...diaAtual,
        ativo: novoAtivo,
        abertura: novoAtivo ? diaAtual.abertura : '',
        fechamento: novoAtivo ? diaAtual.fechamento : '',
      };

      return {
        ...prev,
        horarios: horariosAtualizados,
      };
    });
  }

  function aplicarTodosDias() {
    const primeiroDiaValido = horarios.find(
      (dia) => dia.ativo && dia.abertura && dia.fechamento
    );

    if (!primeiroDiaValido) return;

    setForm((prev) => ({
      ...prev,
      horarios: (Array.isArray(prev.horarios) ? prev.horarios : criarHorarioPadrao()).map((dia) => ({
        ...dia,
        ativo: true,
        abertura: primeiroDiaValido.abertura,
        fechamento: primeiroDiaValido.fechamento,
      })),
    }));
  }

  function limparHorarios() {
    setForm((prev) => ({
      ...prev,
      usarControleHorario: false,
      horarios: criarHorarioPadrao(),
    }));
  }

  const totalDiasAtivos = horarios.filter((dia) => dia.ativo).length;

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Horários</h2>
          <p className="text-sm text-gray-500 mt-1">
            Defina os dias e horários em que este item poderá ser vendido.
          </p>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {totalDiasAtivos} dia(s) ativo(s)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form?.usarControleHorario}
              onChange={(e) => atualizarControleHorario(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Ativar controle de horário
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Quando ativado, o produto só ficará disponível nos dias e horários escolhidos.
              </p>
            </div>
          </label>
        </div>

        {form?.usarControleHorario && (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={aplicarTodosDias}
                className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100"
              >
                Repetir horário em todos
              </button>

              <button
                type="button"
                onClick={limparHorarios}
                className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100"
              >
                Limpar horários
              </button>
            </div>

            <div className="space-y-3">
              {horarios.map((dia, index) => (
                <div
                  key={dia.dia || index}
                  className={`rounded-2xl border p-4 transition ${
                    dia.ativo
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!dia.ativo}
                        onChange={() => alternarDia(index)}
                        className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{dia.label}</p>
                        <p className="text-xs text-gray-500">
                          {dia.ativo ? 'Disponível neste dia' : 'Indisponível neste dia'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto md:min-w-[320px]">
                      <div>
                        <label className={labelClass}>Abertura</label>
                        <input
                          type="time"
                          value={dia.abertura || ''}
                          disabled={!dia.ativo}
                          onChange={(e) =>
                            atualizarDia(index, 'abertura', e.target.value)
                          }
                          className={`${inputClass} ${!dia.ativo ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Fechamento</label>
                        <input
                          type="time"
                          value={dia.fechamento || ''}
                          disabled={!dia.ativo}
                          onChange={(e) =>
                            atualizarDia(index, 'fechamento', e.target.value)
                          }
                          className={`${inputClass} ${!dia.ativo ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700">
                Preencha pelo menos um dia com horário de abertura e fechamento para o produto ficar com disponibilidade controlada.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
