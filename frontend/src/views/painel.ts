import type { Contexto } from '../main.ts';
import { api } from '../api.ts';
import { data, dinheiro, html, icone, montar } from '../ui.ts';

export async function viewPainel({ conteudo }: Contexto) {
  const [est, atrasados, livros, usuarios] = await Promise.all([
    api.estatisticas(), api.emprestimos('ATRASADO'), api.livros(), api.usuarios(),
  ]);
  const livro = new Map(livros.map((l) => [l.id, l.titulo]));
  const usuario = new Map(usuarios.map((u) => [u.id, u]));

  const cartao = (rotulo: string, valor: string | number, classe = '') =>
    html`<div class="stat ${classe}"><span>${rotulo}</span><strong>${valor}</strong></div>`;

  montar(conteudo, html`
    <div class="cabecalho"><div><h1>Painel</h1><p class="muted">Visão geral da biblioteca</p></div></div>
    <div class="stats">
      ${cartao('Títulos', est.titulos)}
      ${cartao('Exemplares disponíveis', est.exemplaresDisponiveis)}
      ${cartao('Leitores', est.usuarios)}
      ${cartao('Empréstimos ativos', est.emprestimosAtivos)}
      ${cartao('Atrasados', est.emprestimosAtrasados, est.emprestimosAtrasados ? 'alerta' : '')}
      ${cartao('Multas acumuladas', dinheiro(est.multaTotal), est.multaTotal ? 'alerta' : '')}
    </div>
    <h2 class="secao">${icone('alerta')} Empréstimos atrasados</h2>
    <div class="lista">
      ${atrasados.length
        ? atrasados.map((e) => {
            const u = usuario.get(e.usuarioId);
            return html`
              <article class="emp">
                <div class="emp-info">
                  <h3>${livro.get(e.livroId) ?? `Livro #${e.livroId}`}</h3>
                  <p class="muted">${u?.nome ?? `Usuário #${e.usuarioId}`}${u?.telefone && ` · ${u.telefone}`}</p>
                  <p class="muted">Venceu em ${data(e.dataPrevistaDevolucao)}</p>
                </div>
                <div class="emp-acao"><span class="multa">${dinheiro(e.multa)}</span></div>
              </article>`;
          })
        : html`<div class="vazio">Nenhum atraso. 🎉</div>`}
    </div>`);
}
