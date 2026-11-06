import type { Contexto } from '../main.ts';
import { api } from '../api.ts';
import type { Autor } from '../types.ts';
import { $, confirmar, html, icone, modal, montar, toast } from '../ui.ts';

export async function viewAutores({ conteudo }: Contexto) {
  const carregar = async () => {
    const [autores, livros] = await Promise.all([api.autores(), api.livros()]);
    const obras = new Map<number, number>();
    for (const l of livros) for (const id of l.autorIds) obras.set(id, (obras.get(id) ?? 0) + 1);

    montar(conteudo, html`
      <div class="cabecalho">
        <div><h1>Autores</h1><p class="muted">${autores.length} ${autores.length === 1 ? 'autor cadastrado' : 'autores cadastrados'}</p></div>
        <button class="btn primary" id="novo">${icone('mais')} Novo autor</button>
      </div>
      ${autores.length
        ? html`
          <div class="tabela-wrap">
            <table class="tabela">
              <thead><tr><th>Nome</th><th>Nacionalidade</th><th class="num">Obras</th><th></th></tr></thead>
              <tbody>
                ${autores.map((a) => html`
                  <tr>
                    <td data-r="Nome"><strong>${a.nome}</strong></td>
                    <td data-r="Nacionalidade">${a.nacionalidade || '—'}</td>
                    <td data-r="Obras" class="num">${obras.get(a.id) ?? 0}</td>
                    <td class="acoes-linha">
                      <button class="btn-icone" data-editar="${a.id}" aria-label="Editar ${a.nome}">${icone('editar')}</button>
                      <button class="btn-icone perigo" data-remover="${a.id}" aria-label="Excluir ${a.nome}">${icone('lixo')}</button>
                    </td>
                  </tr>`)}
              </tbody>
            </table>
          </div>`
        : html`<div class="vazio">Nenhum autor cadastrado ainda.</div>`}`);

    $('#novo')!.addEventListener('click', () => formulario(undefined, carregar));
    conteudo.querySelectorAll<HTMLElement>('[data-editar]').forEach((b) =>
      b.addEventListener('click', () => formulario(autores.find((a) => a.id === Number(b.dataset.editar)), carregar)));
    conteudo.querySelectorAll<HTMLElement>('[data-remover]').forEach((b) =>
      b.addEventListener('click', async () => {
        const a = autores.find((x) => x.id === Number(b.dataset.remover))!;
        if (!(await confirmar('Excluir autor?', `“${a.nome}” será removido. Autores com livros cadastrados não podem ser excluídos.`, 'Excluir'))) return;
        try {
          await api.removerAutor(a.id);
          toast('Autor excluído');
          await carregar();
        } catch (e) {
          toast((e as Error).message, 'erro');
        }
      }));
  };

  await carregar();
}

function formulario(a: Autor | undefined, aoSalvar: () => Promise<void>) {
  const dlg = modal(html`
    <form class="modal-corpo form" id="f" novalidate>
      <h2>${a ? 'Editar autor' : 'Novo autor'}</h2>
      <label>Nome<input name="nome" value="${a?.nome}" maxlength="150" required autofocus /></label>
      <label>Nacionalidade<input name="nacionalidade" value="${a?.nacionalidade}" maxlength="80" placeholder="Ex.: Brasileira" /></label>
      <p class="erro" id="erro" role="alert"></p>
      <div class="acoes">
        <button type="button" class="btn ghost" data-fechar>Cancelar</button>
        <button class="btn primary">Salvar</button>
      </div>
    </form>`);

  $<HTMLFormElement>('#f', dlg)!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const corpo = { nome: String(fd.get('nome')).trim(), nacionalidade: String(fd.get('nacionalidade')).trim() };
    try {
      await (a ? api.atualizarAutor(a.id, corpo) : api.criarAutor(corpo));
      dlg.close();
      toast(a ? 'Autor atualizado' : 'Autor cadastrado');
      await aoSalvar();
    } catch (err) {
      $('#erro', dlg)!.textContent = (err as Error).message;
    }
  });
}
