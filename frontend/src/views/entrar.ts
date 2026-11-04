import { api, sessao } from '../api.ts';
import { $, html, icone, montar, toast } from '../ui.ts';

export function viewEntrar(app: HTMLElement) {
  let modo: 'entrar' | 'criar' = 'entrar';

  const desenhar = () => {
    const criar = modo === 'criar';
    montar(app, html`
      <div class="auth">
        <section class="auth-hero">
          <div class="marca grande">${icone('livro')}<span>Biblioteca</span></div>
          <h1>Encontre, empreste e devolva sem fila.</h1>
          <p>Consulte o acervo, acompanhe seus prazos e fique de olho nas multas — tudo em um só lugar.</p>
        </section>
        <section class="auth-card">
          <h2>${criar ? 'Criar conta' : 'Bem-vindo de volta'}</h2>
          <p class="muted">${criar ? 'Leva menos de um minuto.' : 'Entre com seu e-mail e senha.'}</p>
          <form id="form" class="form" novalidate>
            ${criar && html`
              <label>Nome<input name="nome" autocomplete="name" required /></label>
              <label>Telefone<input name="telefone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000" /></label>`}
            <label>E-mail<input name="email" type="email" autocomplete="email" required /></label>
            <label>Senha<input name="senha" type="password" minlength="6" autocomplete="${criar ? 'new-password' : 'current-password'}" required /></label>
            <p class="erro" id="erro" role="alert"></p>
            <button class="btn primary bloco" id="enviar">${criar ? 'Criar conta' : 'Entrar'}</button>
          </form>
          <p class="troca">${criar ? 'Já tem conta?' : 'Ainda não tem conta?'}
            <button class="link" id="troca">${criar ? 'Entrar' : 'Cadastre-se'}</button></p>
          ${!criar && html`<p class="dica">Demonstração: <code>ana@email.com</code> / <code>123456</code> (bibliotecária)</p>`}
        </section>
      </div>`);

    $('#troca')!.addEventListener('click', () => {
      modo = criar ? 'entrar' : 'criar';
      desenhar();
    });
    $<HTMLFormElement>('#form')!.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement)) as Record<string, string>;
      const btn = $<HTMLButtonElement>('#enviar')!;
      btn.disabled = true;
      $('#erro')!.textContent = '';
      try {
        const s = criar
          ? await api.registrar({ nome: f.nome, email: f.email, telefone: f.telefone, senha: f.senha })
          : await api.login(f.email, f.senha);
        sessao.salvar(s);
        toast(`Olá, ${s.usuario.nome.split(' ')[0]}!`);
        location.hash = '#/';
      } catch (err) {
        $('#erro')!.textContent = (err as Error).message;
        btn.disabled = false;
      }
    });
  };
  desenhar();
}
