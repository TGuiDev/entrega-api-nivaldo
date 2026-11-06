// Template seguro: valores interpolados são escapados, a não ser que venham de html``/raw()
export class Safe {
  valor: string;
  constructor(valor: string) {
    this.valor = valor;
  }
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function parte(v: unknown): string {
  if (v instanceof Safe) return v.valor;
  if (Array.isArray(v)) return v.map(parte).join('');
  if (v === false || v == null) return '';
  return esc(v);
}

export function html(textos: TemplateStringsArray, ...valores: unknown[]): Safe {
  return new Safe(textos.reduce((acc, t, i) => acc + t + (i < valores.length ? parte(valores[i]) : ''), ''));
}

export const montar = (el: Element, conteudo: Safe) => {
  el.innerHTML = conteudo.valor;
};

export const $ = <T extends Element = HTMLElement>(sel: string, raiz: ParentNode = document) =>
  raiz.querySelector<T>(sel);

// ---------- formatação ----------
export const dinheiro = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function diasAte(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ---------- capa gerada a partir do título ----------
// Cores de tecido de encadernação (fundo, texto). Cada título cai sempre na mesma.
const TECIDOS: [string, string][] = [
  ['#7a2e2a', '#f1e4d3'], ['#2f4a3a', '#e9e4d0'], ['#26384d', '#e6e2d6'], ['#8a6a2f', '#f6ecd2'],
  ['#4a3a56', '#ece3ea'], ['#5b4636', '#efe4d2'], ['#34535a', '#e4ebe6'], ['#8b4a3c', '#f4e6dc'],
];
export function capa(titulo: string): string {
  let h = 0;
  for (const c of titulo) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [fundo, texto] = TECIDOS[h % TECIDOS.length];
  return `background:${fundo};color:${texto}`;
}

// ---------- toasts ----------
export function toast(msg: string, tipo: 'ok' | 'erro' = 'ok') {
  const caixa = $('#toasts')!;
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = msg;
  caixa.append(el);
  setTimeout(() => el.classList.add('sai'), 3200);
  setTimeout(() => el.remove(), 3600);
}

// ---------- modal ----------
export function modal(conteudo: Safe): HTMLDialogElement {
  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.innerHTML = conteudo.valor;
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
  dlg.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => dlg.close()));
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

export function confirmar(titulo: string, texto: string, rotulo = 'Confirmar'): Promise<boolean> {
  return new Promise((resolve) => {
    const dlg = modal(html`
      <div class="modal-corpo">
        <h2>${titulo}</h2>
        <p class="muted">${texto}</p>
        <div class="acoes">
          <button class="btn ghost" data-fechar>Cancelar</button>
          <button class="btn danger" id="ok">${rotulo}</button>
        </div>
      </div>`);
    let ok = false;
    $('#ok', dlg)!.addEventListener('click', () => {
      ok = true;
      dlg.close();
    });
    dlg.addEventListener('close', () => resolve(ok));
  });
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms = 250) {
  let t: number;
  return (...a: A) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...a), ms);
  };
}

export const icones = {
  livro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  painel: '<path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sair: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  editar: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  alerta: '<path d="M12 4 2 20h20zM12 10v5M12 18h.01"/>',
};
export const icone = (nome: keyof typeof icones) =>
  new Safe(`<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icones[nome]}</svg>`);
