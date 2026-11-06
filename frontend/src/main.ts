import './style.css';
import { sessao } from './api.ts';
import type { Usuario } from './types.ts';
import { $, html, icone, montar, type Safe } from './ui.ts';
import { viewEntrar } from './views/entrar.ts';
import { viewCatalogo } from './views/catalogo.ts';
import { viewEmprestimos } from './views/emprestimos.ts';
import { viewPainel } from './views/painel.ts';
import { viewAcervo } from './views/acervo.ts';
import { viewAutores } from './views/autores.ts';

export interface Contexto {
  usuario: Usuario;
  conteudo: HTMLElement;
}

interface Rota {
  caminho: string;
  titulo: string;
  icone: Parameters<typeof icone>[0];
  soBibliotecario?: boolean;
  render: (ctx: Contexto) => void | Promise<void>;
}

const rotas: Rota[] = [
  { caminho: '/', titulo: 'Catálogo', icone: 'livro', render: viewCatalogo },
  { caminho: '/emprestimos', titulo: 'Empréstimos', icone: 'lista', render: viewEmprestimos },
  { caminho: '/painel', titulo: 'Painel', icone: 'painel', soBibliotecario: true, render: viewPainel },
  { caminho: '/acervo', titulo: 'Acervo', icone: 'mais', soBibliotecario: true, render: viewAcervo },
  { caminho: '/autores', titulo: 'Autores', icone: 'pessoa', soBibliotecario: true, render: viewAutores },
];

const app = $('#app')!;

function iniciais(nome: string) {
  return nome.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function casca(usuario: Usuario, atual: string): Safe {
  const visiveis = rotas.filter((r) => !r.soBibliotecario || usuario.perfil === 'BIBLIOTECARIO');
  const links = (classe: string) =>
    visiveis.map(
      (r) => html`<a href="#${r.caminho}" class="${classe} ${r.caminho === atual ? 'ativo' : ''}">${icone(r.icone)}<span>${r.titulo}</span></a>`,
    );
  return html`
    <header class="topo">
      <div class="topo-in">
        <a href="#/" class="marca">${icone('livro')}<span>Biblioteca</span></a>
        <nav class="nav-desktop">${links('nav-link')}</nav>
        <div class="usuario">
          <div class="avatar" aria-hidden="true">${iniciais(usuario.nome)}</div>
          <div class="usuario-info">
            <strong>${usuario.nome}</strong>
            <small>${usuario.perfil === 'BIBLIOTECARIO' ? 'Bibliotecário' : 'Leitor'}</small>
          </div>
          <button class="btn-icone" id="sair" title="Sair" aria-label="Sair">${icone('sair')}</button>
        </div>
      </div>
    </header>
    <main class="pagina" id="conteudo"></main>
    <nav class="nav-mobile">${links('tab')}</nav>`;
}

let geracao = 0;

async function navegar() {
  const id = ++geracao;
  const caminho = location.hash.replace(/^#/, '') || '/';
  const s = sessao.ler();

  if (caminho === '/entrar') {
    if (s) return void (location.hash = '#/');
    document.title = 'Entrar · Biblioteca';
    return viewEntrar(app);
  }
  if (!s) return void (location.hash = '#/entrar');

  const rota = rotas.find((r) => r.caminho === caminho);
  if (!rota || (rota.soBibliotecario && s.usuario.perfil !== 'BIBLIOTECARIO')) {
    return void (location.hash = '#/');
  }

  document.title = `${rota.titulo} · Biblioteca`;
  montar(app, casca(s.usuario, rota.caminho));
  $('#sair')!.addEventListener('click', () => {
    sessao.limpar();
    location.hash = '#/entrar';
  });
  const conteudo = $('#conteudo')!;
  conteudo.innerHTML = '<div class="carregando"><span class="spinner"></span></div>';
  await rota.render({ usuario: s.usuario, conteudo });
  if (id !== geracao) return;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navegar);
navegar();
