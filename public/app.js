const selecionar = id => document.getElementById(id);
const criar = selecionar('criar');
const carregar = selecionar('carregar');
const entrar = selecionar('entrar');
const consultar = selecionar('consultar');
const comandos = selecionar('comandos');
const mensagemAcao = selecionar('acao-status');
const botaoTravar = selecionar('travar');
const botaoSortear = selecionar('sortear');
let grupoAtual;

for (const botao of document.querySelectorAll('.switch button')) {
  botao.addEventListener('click', () => {
    for (const opcao of document.querySelectorAll('.switch button')) {
      const ativo = opcao === botao;
      opcao.setAttribute('aria-pressed', String(ativo));
      selecionar(opcao.getAttribute('aria-controls')).hidden = !ativo;
    }
  });
}

async function api(rota, dados, headers = {}) {
  const resposta = await fetch(rota, {
    method: dados ? 'POST' : 'GET',
    headers: dados ? { ...headers, 'Content-Type': 'application/json' } : headers,
    body: dados ? JSON.stringify(dados) : undefined
  });
  const resultado = await resposta.json().catch(() => null);
  if (!resposta.ok || !resultado) throw new Error(resultado?.erro || 'Não foi possível concluir a operação.');
  return resultado;
}

function status(elemento, mensagem, erro = false) {
  elemento.toggleAttribute('data-error', erro);
  elemento.textContent = mensagem;
}

function codigo(valor) {
  return valor.trim().toUpperCase();
}

function vincular(formulario, enviar) {
  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    const botao = formulario.querySelector('button[type=submit]');
    const retorno = formulario.querySelector('.status');
    if (botao.disabled) return;
    botao.disabled = true;
    status(retorno, 'Carregando…');
    try {
      const dados = new FormData(formulario);
      status(retorno, await enviar(dados));
    } catch (erro) {
      status(retorno, erro.message, true);
    } finally {
      botao.disabled = false;
    }
  });
}

function renderGrupo(credenciais, grupo, mostrarChave = false) {
  grupoAtual = { credenciais, grupo, mostrarChave };
  selecionar('painel').hidden = false;
  selecionar('grupo-nome').textContent = grupo.grupo;
  selecionar('grupo-codigo').textContent = credenciais.codigo_grupo;
  selecionar('organizador-codigo').textContent = mostrarChave ? credenciais.codigo_organizador : '';
  selecionar('organizador-novo').hidden = !mostrarChave;

  const fase = grupo.sorteado ? 'Sorteado' : grupo.travado ? 'Travado' : 'Aberto';
  selecionar('grupo-estado').textContent = fase + ' · ' + grupo.total + '/' + grupo.quantidade_maxima_pessoas + ' participantes';
  const pessoas = grupo.participantes.map(pessoa => {
    const item = document.createElement('li');
    item.textContent = pessoa.nome;
    return item;
  });
  selecionar('grupo-pessoas').replaceChildren(...pessoas);

  botaoTravar.textContent = grupo.travado ? 'Destravar grupo' : 'Travar grupo';
  botaoTravar.disabled = grupo.sorteado;
  const completo = grupo.total === grupo.quantidade_maxima_pessoas;
  botaoSortear.disabled = grupo.sorteado || !grupo.travado || !completo;
  selecionar('regra').textContent = grupo.sorteado
    ? 'Sorteio concluído. Cada participante consulta seu resultado com o código pessoal.'
    : 'O sorteio fica disponível quando o grupo estiver completo e travado.';
}

function consultarGrupo(credenciais) {
  const query = new URLSearchParams({ codigo_grupo: credenciais.codigo_grupo });
  return api('/grupos/participantes?' + query, undefined, {
    'X-Codigo-Organizador': credenciais.codigo_organizador
  });
}

vincular(criar, async dados => {
  const { grupo, mensagem } = await api('/grupos/criar', {
    nome: dados.get('nome'),
    quantidade_maxima_pessoas: Number(dados.get('quantidade_maxima_pessoas'))
  });
  const credenciais = { codigo_grupo: grupo.codigo, codigo_organizador: grupo.codigo_organizador };
  carregar.elements.namedItem('codigo_grupo').value = credenciais.codigo_grupo;
  carregar.elements.namedItem('codigo_organizador').value = credenciais.codigo_organizador;
  entrar.elements.namedItem('codigo_grupo').value = credenciais.codigo_grupo;
  renderGrupo(credenciais, {
    grupo: grupo.nome,
    total: 0,
    quantidade_maxima_pessoas: grupo.quantidade_maxima_pessoas,
    travado: false,
    sorteado: false,
    participantes: []
  }, true);
  status(mensagemAcao, '');
  return mensagem;
});

vincular(carregar, async dados => {
  const credenciais = {
    codigo_grupo: codigo(dados.get('codigo_grupo')),
    codigo_organizador: codigo(dados.get('codigo_organizador'))
  };
  renderGrupo(credenciais, await consultarGrupo(credenciais));
  status(mensagemAcao, '');
  return 'Grupo carregado.';
});

async function acaoGrupo(rota, dados = {}) {
  if (!grupoAtual || comandos.disabled) return;
  const atual = grupoAtual;
  comandos.disabled = true;
  status(mensagemAcao, 'Carregando…');
  let mensagem;
  let falha = false;
  try {
    mensagem = rota ? (await api(rota, { ...atual.credenciais, ...dados })).mensagem : 'Lista atualizada.';
    const grupo = await consultarGrupo(atual.credenciais);
    if (grupoAtual === atual) renderGrupo(atual.credenciais, grupo, atual.mostrarChave);
  } catch (erro) {
    mensagem = erro.message;
    falha = true;
  } finally {
    status(mensagemAcao, mensagem, falha);
    comandos.disabled = false;
  }
}

botaoTravar.addEventListener('click', () => acaoGrupo('/grupos/travar', { travar: !grupoAtual.grupo.travado }));
botaoSortear.addEventListener('click', () => acaoGrupo('/grupos/sortear'));
selecionar('atualizar').addEventListener('click', () => acaoGrupo());

vincular(entrar, async dados => {
  const grupo = codigo(dados.get('codigo_grupo'));
  const { participante, mensagem } = await api('/participantes/entrar', {
    codigo_grupo: grupo,
    nome: dados.get('nome'),
    email: dados.get('email') || null
  });
  selecionar('pessoal-codigo').textContent = participante.codigo_pessoal;
  selecionar('pessoal-novo').hidden = false;
  consultar.elements.namedItem('codigo_grupo').value = grupo;
  consultar.elements.namedItem('codigo_pessoal').value = participante.codigo_pessoal;
  entrar.elements.namedItem('nome').value = '';
  entrar.elements.namedItem('email').value = '';
  return mensagem;
});

vincular(consultar, async dados => {
  const resultado = await api('/resultado/consultar', {
    codigo_grupo: codigo(dados.get('codigo_grupo')),
    codigo_pessoal: codigo(dados.get('codigo_pessoal'))
  });
  return resultado.seu_nome + ', você tirou ' + resultado.amigo_secreto + '.';
});
