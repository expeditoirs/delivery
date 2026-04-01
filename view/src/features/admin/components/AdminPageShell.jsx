export default function AdminPageShell({ eyebrow = 'Painel admin', title, description, children }) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-24">
      <div className="border-b border-slate-200 bg-white/90 px-4 pb-5 pt-6 backdrop-blur xl:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-4 xl:px-6 xl:py-6">{children}</div>
    </div>
  );
}