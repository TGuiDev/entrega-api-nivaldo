import type { Contexto } from '../main.ts';
import { api } from '../api.ts';
import type { Autor, Categoria, Livro } from '../types.ts';
import { $, capa, debounce, html, icone, montar, toast } from '../ui.ts';

export async function viewCatalogo({ usuario, conteudo }: Contexto) {
  const [categorias, autores] = await Promise.all([api.categorias(), api.autores()]);
  const catPorId = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));
  const autorPorId = new Map<number, Autor>(autores.map((a) => [a.id, a]));

  montar(conteudo, html`
    <div class="cabecalho">
      <div><h1>Catálogo</h1><p class="muted" id="contagem">&nbsp;</p></div>
    </div>
    <div class="filtros">
      <label class="busca">${icone('busca')}
        <input id="busca" type="search" placeholder="Buscar por título, autor ou ISBN" /></label>
      <select id="categoria" aria-label="Categoria">
        <option value="">Todas as categorias</option>
        ${categorias.map((c) => html`<option value="${c.id}">${c.nome}</option>`)}
      </select>
      <label class="check"><input id="disp" type="checkbox" /><span>Só disponíveis</span></label>
    </div>
    <div id="grade" class="grade"></div>`);

  const grade = $('#grade', conteudo)!;
  const carregar = async () => {
    try {
      const livros = await api.livros({
        busca: $<HTMLInputElement>('#busca')!.value.trim(),
        categoriaId: $<HTMLSelectElement>('#categoria')!.value,
        disponivel: $<HTMLInputElement>('#disp')!.checked,
      });
      $('#contagem')!.textContent = `${livros.length} ${livros.length === 1 ? 'livro' : 'livros'}`;
      montar(grade, livros.length ? html`${livros.map(cartao)}` : html`<div class="vazio">Nenhum livro encontrado.</div>`);
    } catch (e) {
      toast((e as Error).message, 'erro');
    }
  };

  const cartao = (l: Livro) => {
    const nomes = l.autorIds.map((id) => autorPorId.get(id)?.nome).filter(Boolean).join(', ');
    const disp = l.quantidadeDisponivel > 0;
    return html`
      <article class="livro">
        <div class="capa" style="${capa(l.titulo)}"><span>${l.titulo}</span></div>
        <div class="livro-info">
          <span class="tag">${catPorId.get(l.categoriaId ?? 0)?.nome ?? 'Sem categoria'}</span>
          <h3>${l.titulo}</h3>
          <p class="muted">${nomes || 'Autor desconhecido'}${l.anoPublicacao ? ` · ${l.anoPublicacao}` : ''}</p>
          <div class="livro-rodape">
            <span class="badge ${disp ? 'ok' : 'off'}">${disp ? `${l.quantidadeDisponivel} disp.` : 'Indisponível'}</span>
            <button class="btn primary sm" data-emprestar="${l.id}" ${!disp && 'disabled'}>Emprestar</button>
          </div>
        </div>
      </article>`;
  };

  grade.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-emprestar]');
    if (!btn) return;
    btn.disabled = true;
    try {
      await api.emprestar(Number(btn.dataset.emprestar), usuario.id);
      toast('Empréstimo realizado! Devolva em até 7 dias.');
      await carregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
      btn.disabled = false;
    }
  });
  const atrasado = debounce(carregar);
  $('#busca')!.addEventListener('input', atrasado);
  $('#categoria')!.addEventListener('change', carregar);
  $('#disp')!.addEventListener('change', carregar);
  await carregar();
}
