import type { Contexto } from '../main.ts';
import { api } from '../api.ts';
import type { Emprestimo, Livro, Usuario } from '../types.ts';
import { data, diasAte, dinheiro, html, montar, toast, capa } from '../ui.ts';

type Aba = 'abertos' | 'todos';

export async function viewEmprestimos({ usuario, conteudo }: Contexto) {
  const bib = usuario.perfil === 'BIBLIOTECARIO';
  let aba: Aba = 'abertos';
  const [livros, usuarios] = await Promise.all([api.livros(), bib ? api.usuarios() : Promise.resolve([] as Usuario[])]);
  const livroPorId = new Map<number, Livro>(livros.map((l) => [l.id, l]));
  const usuarioPorId = new Map<number, Usuario>(usuarios.map((u) => [u.id, u]));

  const carregar = async () => {
    const todos = await api.emprestimos();
    const lista = aba === 'abertos' ? todos.filter((e) => e.status !== 'DEVOLVIDO') : todos;
    const multa = todos.reduce((s, e) => s + e.multa, 0);

    montar(conteudo, html`
      <div class="cabecalho">
        <div><h1>${bib ? 'Empréstimos' : 'Meus empréstimos'}</h1>
          <p class="muted">${todos.filter((e) => e.status !== 'DEVOLVIDO').length} em aberto${multa > 0 ? ` · multas somam ${dinheiro(multa)}` : ''}</p></div>
        <div class="abas" role="tablist">
          <button role="tab" class="${aba === 'abertos' && 'ativa'}" data-aba="abertos">Em aberto</button>
          <button role="tab" class="${aba === 'todos' && 'ativa'}" data-aba="todos">Histórico</button>
        </div>
      </div>
      <div class="lista">
        ${lista.length ? lista.map(item) : html`<div class="vazio">Nada por aqui ainda.</div>`}
      </div>`);
  };

  const item = (e: Emprestimo) => {
    const livro = livroPorId.get(e.livroId);
    const dias = diasAte(e.dataPrevistaDevolucao);
    const aberto = e.status !== 'DEVOLVIDO';
    const prazo = !aberto
      ? `Devolvido em ${data(e.dataDevolucao)}`
      : dias >= 0
        ? `Vence ${dias === 0 ? 'hoje' : `em ${dias} ${dias === 1 ? 'dia' : 'dias'}`} (${data(e.dataPrevistaDevolucao)})`
        : `Venceu em ${data(e.dataPrevistaDevolucao)}`;
    return html`
      <article class="emp">
        <div class="mini-capa" style="${capa(livro?.titulo ?? '?')}"></div>
        <div class="emp-info">
          <h3>${livro?.titulo ?? `Livro #${e.livroId}`}</h3>
          <p class="muted">${bib && `${usuarioPorId.get(e.usuarioId)?.nome ?? `Usuário #${e.usuarioId}`} · `}${prazo}</p>
          ${e.multa > 0 && html`<p class="multa">Multa: ${dinheiro(e.multa)}</p>`}
        </div>
        <div class="emp-acao">
          <span class="badge ${e.status.toLowerCase()}">${e.status === 'ATIVO' ? 'Ativo' : e.status === 'ATRASADO' ? 'Atrasado' : 'Devolvido'}</span>
          ${aberto && html`<button class="btn sm" data-devolver="${e.id}">Devolver</button>`}
        </div>
      </article>`;
  };

  conteudo.addEventListener('click', async (ev) => {
    const alvo = ev.target as HTMLElement;
    const abaBtn = alvo.closest<HTMLElement>('[data-aba]');
    if (abaBtn) {
      aba = abaBtn.dataset.aba as Aba;
      return carregar();
    }
    const btn = alvo.closest<HTMLButtonElement>('[data-devolver]');
    if (!btn) return;
    btn.disabled = true;
    try {
      const r = await api.devolver(Number(btn.dataset.devolver));
      toast(r.multa > 0 ? `Devolvido. Multa de ${dinheiro(r.multa)}.` : 'Devolução registrada. Obrigado!');
      await carregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
      btn.disabled = false;
    }
  });
  await carregar();
}
