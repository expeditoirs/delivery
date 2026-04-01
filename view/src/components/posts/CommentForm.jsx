import { useState } from "react";
import { containsProfanity } from "../../utils/profanityFilter";

export default function CommentForm({ onSubmit }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const value = texto.trim();
    if (!value) return;
    if (containsProfanity(value)) {
      setErro('Remova palavroes ou ofensas antes de comentar.');
      return;
    }
    setErro('');
    onSubmit?.(value);
    setTexto("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="text-xs font-semibold text-theme-muted uppercase tracking-wide">
          Adicionar comentario
        </label>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Conte o que achou do pedido, atendimento ou entrega..."
          className="w-full mt-1.5 px-4 py-3 rounded-2xl text-sm resize-none outline-none
          bg-theme-surface text-theme-text
          border border-theme-border
          placeholder:text-theme-muted
          focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/30 transition"
        />
        {erro ? <p className="mt-2 text-sm text-rose-400">{erro}</p> : null}
      </div>

      <button
        type="submit"
        className="bg-theme-primary text-white px-5 py-3 rounded-2xl font-bold text-sm
        hover:bg-theme-accent transition"
      >
        Enviar
      </button>
    </form>
  );
}