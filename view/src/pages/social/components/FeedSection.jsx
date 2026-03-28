import PostCard from "../../../components/posts/PostCard";

export default function FeedSection({ erro, loading, feed }) {
  return (
    <section className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-50">Feed da comunidade</h2>
          <p className="text-xs text-theme-muted">Posts reais do que foi pedido, aprovado e compartilhado</p>
        </div>
        <span className="text-xs text-theme-muted text-right">Rolagem infinita visual</span>
      </div>

      {erro && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {erro}
        </div>
      )}

      {loading && Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="theme-card rounded-[28px] p-4 animate-pulse">
          <div className="h-10 w-40 bg-slate-700/60 rounded-full mb-4" />
          <div className="h-72 bg-slate-800/90 rounded-[24px] mb-4" />
          <div className="h-3 bg-slate-700/60 rounded-full w-full mb-2" />
          <div className="h-3 bg-slate-800/90 rounded-full w-2/3" />
        </div>
      ))}

      {!loading && !feed.length && (
        <div className="theme-card rounded-[28px] p-8 text-center text-theme-muted">
          Ainda não há publicações aprovadas no feed.
        </div>
      )}

      {!loading && feed.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
