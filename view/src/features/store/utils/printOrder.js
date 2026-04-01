function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('pt-BR');
}

function buildAddress(order) {
  const line1 = [order?.endereco_rua, order?.endereco_numero].filter(Boolean).join(', ');
  const line2 = [order?.endereco_bairro, order?.endereco_cidade, order?.endereco_estado].filter(Boolean).join(' - ');
  const parts = [line1, order?.endereco_complemento, line2].filter(Boolean);
  return parts.join('<br />');
}

function hasDeliveryAddress(order) {
  return Boolean(order?.endereco_rua || order?.endereco_bairro || order?.endereco_cidade);
}

function getFulfillmentLabel(order) {
  return hasDeliveryAddress(order) ? 'ENTREGA' : 'RETIRADA';
}

function renderComplementos(item) {
  const complementos = item?.complementos;
  if (!complementos) return '';

  const lines = [];
  const adicionais = Array.isArray(complementos.adicionais) ? complementos.adicionais : [];
  const grupos = Array.isArray(complementos.grupos) ? complementos.grupos : [];

  adicionais.forEach((adicional) => {
    if (!adicional?.nome) return;
    const quantidade = Number(adicional.quantidade || 1);
    lines.push(`${quantidade > 1 ? `${quantidade}x ` : ''}${adicional.nome}`);
  });

  grupos.forEach((grupo) => {
    const escolhas = Array.isArray(grupo?.escolhas) ? grupo.escolhas.filter(Boolean) : [];
    if (!escolhas.length) return;
    const titulo = grupo?.nome ? `${grupo.nome}: ` : '';
    lines.push(`${titulo}${escolhas.join(', ')}`);
  });

  if (!lines.length) return '';

  return `
    <div class="meta">
      <strong>Complementos:</strong><br />
      ${lines.map((line) => escapeHtml(line)).join('<br />')}
    </div>
  `;
}

function renderItem(item) {
  const sabores = Array.isArray(item?.sabores) ? item.sabores.filter(Boolean) : [];
  const quantidade = Number(item?.quantidade || 1);
  const tamanho = item?.tamanho ? `<div class="meta"><strong>Tamanho:</strong> ${escapeHtml(item.tamanho)}</div>` : '';
  const saboresBlock = sabores.length
    ? `<div class="meta"><strong>Sabores:</strong> ${escapeHtml(sabores.join(' / '))}</div>`
    : '';
  const observacao = item?.observacao
    ? `<div class="note"><strong>Obs:</strong> ${escapeHtml(item.observacao)}</div>`
    : '';

  return `
    <div class="item">
      <div class="row strong">
        <span>${quantidade}x ${escapeHtml(item?.nome_item || 'Item')}</span>
        <span>${money(Number(item?.preco_unitario || 0) * quantidade)}</span>
      </div>
      ${tamanho}
      ${saboresBlock}
      ${renderComplementos(item)}
      ${observacao}
    </div>
  `;
}

function baseStyles() {
  return `
    <style>
      @page { size: 80mm auto; margin: 6mm; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        font-family: "Courier New", monospace;
        color: #111;
        background: #fff;
        width: 72mm;
      }
      body { padding: 4mm 0; font-size: 12px; line-height: 1.35; }
      .ticket { width: 100%; }
      .center { text-align: center; }
      .title { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
      .subtitle { margin-top: 2px; font-size: 11px; }
      .badge {
        display: inline-block;
        border: 1px solid #111;
        padding: 3px 8px;
        font-weight: 700;
        margin-top: 6px;
      }
      .section {
        border-top: 1px dashed #111;
        margin-top: 8px;
        padding-top: 8px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: flex-start;
      }
      .strong { font-weight: 700; }
      .muted { color: #444; }
      .item { padding: 6px 0; border-bottom: 1px dashed #ddd; }
      .item:last-child { border-bottom: 0; }
      .meta { margin-top: 3px; color: #222; }
      .note {
        margin-top: 4px;
        padding: 4px;
        border: 1px dashed #111;
        background: #f5f5f5;
        font-weight: 700;
      }
      .footer { margin-top: 10px; border-top: 1px dashed #111; padding-top: 8px; text-align: center; }
    </style>
  `;
}

function openPrintWindow(title, body) {
  const popup = window.open('', '_blank', 'width=420,height=720');
  if (!popup) {
    throw new Error('O navegador bloqueou a janela de impressao.');
  }

  popup.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        ${baseStyles()}
      </head>
      <body>
        ${body}
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.onload = () => {
    popup.print();
  };
}

export function printKitchenTicket(order, items) {
  const cliente = escapeHtml(order?.cliente_nome || order?.usuario_nome || 'Cliente');
  const body = `
    <main class="ticket">
      <div class="center">
        <div class="title">COZINHA</div>
        <div class="subtitle">Pedido #${escapeHtml(order?.id)}</div>
        <div class="badge">${escapeHtml(getFulfillmentLabel(order))}</div>
      </div>

      <section class="section">
        <div class="row"><span class="strong">Cliente</span><span>${cliente}</span></div>
        <div class="row"><span class="strong">Data</span><span>${escapeHtml(formatDate(order?.data_pedido))}</span></div>
        <div class="row"><span class="strong">Itens</span><span>${escapeHtml(order?.total_itens || items.length || 0)}</span></div>
      </section>

      <section class="section">
        ${items.map(renderItem).join('') || '<div class="muted">Sem itens para imprimir.</div>'}
      </section>

      <section class="section">
        <div class="row strong"><span>Total do pedido</span><span>${money(order?.total)}</span></div>
      </section>

      <div class="footer">
        Conferir montagem, observacoes e adicionais antes de liberar.
      </div>
    </main>
  `;

  openPrintWindow(`Cozinha Pedido #${order?.id}`, body);
}

export function printDispatchTicket(order, items) {
  const fulfillment = getFulfillmentLabel(order);
  const cliente = escapeHtml(order?.cliente_nome || order?.usuario_nome || 'Cliente');
  const address = buildAddress(order);
  const totalQuantidade = items.reduce((acc, item) => acc + Number(item?.quantidade || 0), 0);

  const body = `
    <main class="ticket">
      <div class="center">
        <div class="title">${fulfillment}</div>
        <div class="subtitle">Pedido #${escapeHtml(order?.id)}</div>
        <div class="badge">${escapeHtml(String(order?.status || 'pendente').toUpperCase())}</div>
      </div>

      <section class="section">
        <div class="row"><span class="strong">Cliente</span><span>${cliente}</span></div>
        <div class="row"><span class="strong">Data</span><span>${escapeHtml(formatDate(order?.data_pedido))}</span></div>
        <div class="row"><span class="strong">Volumes</span><span>${escapeHtml(totalQuantidade || order?.total_itens || 0)}</span></div>
      </section>

      <section class="section">
        ${fulfillment === 'ENTREGA'
          ? `
            <div class="strong">Endereco</div>
            <div class="meta">${address || 'Endereco nao informado.'}</div>
          `
          : `
            <div class="strong">Retirada no balcao</div>
            <div class="meta">Separar pedido para entrega ao cliente na loja.</div>
          `}
      </section>

      <section class="section">
        ${items.map((item) => `
          <div class="row">
            <span>${Number(item?.quantidade || 1)}x ${escapeHtml(item?.nome_item || 'Item')}</span>
            <span>${money(Number(item?.preco_unitario || 0) * Number(item?.quantidade || 1))}</span>
          </div>
        `).join('') || '<div class="muted">Sem itens para imprimir.</div>'}
      </section>

      <section class="section">
        <div class="row strong"><span>Total</span><span>${money(order?.total)}</span></div>
      </section>

      <div class="footer">
        ${fulfillment === 'ENTREGA' ? 'Conferir rota, endereco e volumes antes da saida.' : 'Conferir nome do cliente e liberar somente na retirada.'}
      </div>
    </main>
  `;

  openPrintWindow(`${fulfillment} Pedido #${order?.id}`, body);
}
