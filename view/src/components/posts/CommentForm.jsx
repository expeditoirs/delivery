import { useState } from "react";

export default function CommentForm({ onSubmit }) {
  const [texto, setTexto] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const value = texto.trim();
    if (!value) return;
    onSubmit?.(value);
    setTexto("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adicionar comentário</label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Conte o que achou do pedido, atendimento ou entrega..."
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1.5 text-sm resize-none outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
        />
      </div>
      <button type="submit" className="bg-red-500 text-white px-5 py-3 rounded-2xl font-bold text-sm">
        Enviar
      </button>
    </form>
  );
}
