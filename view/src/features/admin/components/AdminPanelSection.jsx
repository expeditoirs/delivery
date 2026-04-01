function EmptyState({ message }) {
  return <p className="text-sm text-gray-400">{message}</p>;
}

function AdminPanelItem({ children }) {
  return <div className="rounded-xl border border-gray-100 p-3">{children}</div>;
}

export default function AdminPanelSection({ title, items, emptyMessage, renderItem }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="font-bold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3">
        {items.length ? items.map((item) => (
          <AdminPanelItem key={item.id}>
            {renderItem(item)}
          </AdminPanelItem>
        )) : <EmptyState message={emptyMessage} />}
      </div>
    </section>
  );
}
