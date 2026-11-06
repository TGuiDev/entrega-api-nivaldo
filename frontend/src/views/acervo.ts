import type { Contexto } from '../main.ts';
import { api } from '../api.ts';
import type { Autor, Livro, LivroForm } from '../types.ts';
import { $, confirmar, html, icone, modal, montar, toast } from '../ui.ts';

export async function viewAcervo({ conteudo }: Contexto) {
  const [autores, categorias] = await Promise.all([api.autores(), api.categorias()]);
  const autor = new Map(autores.map((a) => [a.id, a.nome]));
  const categoria = new Map(categorias.map((c) => [c.id, c.nome]));

  const carregar = async () => {
    const livros = await api.livros();
    montar(conteudo, html`
      <div class="cabecalho">
        <div><h1>Acervo</h1><p class="muted">${livros.length} títulos cadastrados</p></div>
        <button class="btn primary" id="novo">${icone('mais')} Novo livro</button>
      </div>
      <div class="tabela-wrap">
        <table class="tabela">
          <thead><tr><th>Título</th><th>Autor(es)</th><th>Categoria</th><th class="num">Estoque</th><th></th></tr></thead>
          <tbody>
            ${livros.map((l) => html`
              <tr>
                <td data-r="Título"><div><strong>${l.titulo}</strong><br /><small class="muted">${l.isbn}</small></div></td>
                <td data-r="Autor(es)">${l.autorIds.map((id) => autor.get(id)).join(', ')}</td>
                <td data-r="Categoria">${categoria.get(l.categoriaId ?? 0)}</td>
                <td data-r="Estoque" class="num">${l.quantidadeDisponivel}</td>
                <td class="acoes-linha">
                  <button class="btn-icone" data-editar="${l.id}" aria-label="Editar ${l.titulo}">${icone('editar')}</button>
                  <button class="btn-icone perigo" data-remover="${l.id}" aria-label="Excluir ${l.titulo}">${icone('lixo')}</button>
                </td>
              </tr>`)}
          </tbody>
        </table>
      </div>`);

    $('#novo')!.addEventListener('click', () => formulario());
    conteudo.querySelectorAll<HTMLElement>('[data-editar]').forEach((b) =>
      b.addEventListener('click', () => formulario(livros.find((l) => l.id === Number(b.dataset.editar)))));
    conteudo.querySelectorAll<HTMLElement>('[data-remover]').forEach((b) =>
      b.addEventListener('click', async () => {
        const l = livros.find((x) => x.id === Number(b.dataset.remover))!;
        if (!(await confirmar('Excluir livro?', `“${l.titulo}” será removido do acervo.`, 'Excluir'))) return;
        try {
          await api.removerLivro(l.id);
          toast('Livro excluído');
          await carregar();
        } catch (e) {
          toast((e as Error).message, 'erro');
        }
      }));
  };

  const chipAutor = (a: Autor, marcado: boolean) =>
    html`<label class="chip"><input type="checkbox" name="autor" value="${a.id}" ${marcado && 'checked'} /><span>${a.nome}</span></label>`;

  const formulario = (l?: Livro) => {
    const dlg = modal(html`
      <form class="modal-corpo form" id="f" novalidate>
        <h2>${l ? 'Editar livro' : 'Novo livro'}</h2>
        <label>Título<input name="titulo" value="${l?.titulo}" required /></label>
        <div class="duas">
          <label>ISBN<input name="isbn" value="${l?.isbn}" /></label>
          <label>Ano<input name="ano" type="number" min="0" max="2100" value="${l?.anoPublicacao}" /></label>
        </div>
        <div class="duas">
          <label>Estoque<input name="qtd" type="number" min="0" value="${l?.quantidadeDisponivel ?? 1}" required /></label>
          <label>Categoria
            <select name="categoria" required>
              ${categorias.map((c) => html`<option value="${c.id}" ${c.id === l?.categoriaId && 'selected'}>${c.nome}</option>`)}
            </select></label>
        </div>
        <fieldset><legend>Autores</legend>
          <div class="chips">
            ${autores.map((a) => chipAutor(a, l?.autorIds.includes(a.id) ?? false))}
          </div>
          <div class="autor-rapido">
            <input id="novo-autor" placeholder="Autor não está na lista? Digite o nome" maxlength="150" aria-label="Nome do novo autor" />
            <button type="button" class="btn sm" id="add-autor">Adicionar</button>
          </div>
        </fieldset>
        <p class="erro" id="erro" role="alert"></p>
        <div class="acoes">
          <button type="button" class="btn ghost" data-fechar>Cancelar</button>
          <button class="btn primary">Salvar</button>
        </div>
      </form>`);

    // Cadastro rápido: cria o autor na hora e já o deixa marcado
    const campo = $<HTMLInputElement>('#novo-autor', dlg)!;
    const adicionar = async () => {
      const nome = campo.value.trim();
      if (!nome) return;
      try {
        const novo = await api.criarAutor({ nome, nacionalidade: '' });
        autores.push(novo);
        autor.set(novo.id, novo.nome);
        $('.chips', dlg)!.insertAdjacentHTML('beforeend', chipAutor(novo, true).valor);
        campo.value = '';
        $('#erro', dlg)!.textContent = '';
        toast('Autor cadastrado');
      } catch (err) {
        $('#erro', dlg)!.textContent = (err as Error).message;
      }
    };
    $('#add-autor', dlg)!.addEventListener('click', adicionar);
    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void adicionar();
      }
    });

    $<HTMLFormElement>('#f', dlg)!.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget as HTMLFormElement);
      const corpo: LivroForm = {
        titulo: String(fd.get('titulo')).trim(),
        isbn: String(fd.get('isbn')).trim(),
        anoPublicacao: fd.get('ano') ? Number(fd.get('ano')) : null,
        quantidadeDisponivel: Number(fd.get('qtd')),
        categoriaId: Number(fd.get('categoria')),
        autorIds: fd.getAll('autor').map(Number),
      };
      try {
        await (l ? api.atualizarLivro(l.id, corpo) : api.criarLivro(corpo));
        dlg.close();
        toast(l ? 'Livro atualizado' : 'Livro cadastrado');
        await carregar();
      } catch (err) {
        $('#erro', dlg)!.textContent = (err as Error).message;
      }
    });
  };

  await carregar();
}
