# Amigo Secreto

API REST em Node.js, Express e MySQL para criar grupos de amigo secreto, gerenciar participantes e sortear. A interface em HTML, CSS e JavaScript usa as mesmas rotas da API.

[Execuções dos testes no GitHub Actions](https://github.com/cadualvg/amigo-secreto/actions/workflows/test.yml)

## Regras do sorteio

- O grupo aceita uma quantidade par de participantes, a partir de duas pessoas.
- O organizador pode travar o grupo. O sorteio exige um grupo completo e travado.
- Cada pessoa tira outra e é sorteada exatamente uma vez. O algoritmo de Sattolo embaralha os participantes em um único ciclo, com uma fonte de aleatoriedade do Node.js.
- O MySQL bloqueia a linha do grupo durante as alterações. As atribuições e o estado **sorteado** são gravados na mesma transação. Uma falha desfaz a operação, e um segundo sorteio recebe HTTP 409.
- Cada consulta de resultado exige o código do grupo e um código pessoal.

## Executar localmente

Use Node.js 24 e MySQL 8. Crie um banco chamado `amigo_secreto`, copie `.env.example` para `.env` e preencha as credenciais do banco.

```sh
npm ci
npm run db:setup
npm start
```

Abra [a interface local](http://localhost:3000). Como organizador, crie um grupo de duas pessoas. Na área **Participante**, adicione duas pessoas fictícias e guarde seus códigos. Volte ao painel, atualize a lista, trave o grupo e sorteie. Use cada código pessoal para consultar um resultado.

`npm run db:setup` cria as tabelas ausentes. Pode ser executado novamente no mesmo banco.

## Rotas

As rotas recebem JSON e as respostas de erro incluem o campo `erro`.

| Método e rota | Dados e finalidade |
| --- | --- |
| `POST /grupos/criar` | `nome` e `quantidade_maxima_pessoas`. Retorna os códigos do grupo e do organizador. Aceita `descricao`, `valor_presente` e `data_evento` opcionais. |
| `GET /grupos/participantes` | `codigo_grupo` na query e código do organizador no cabeçalho `X-Codigo-Organizador` ou na query como `codigo_organizador`. Retorna participantes e estado. |
| `POST /grupos/travar` | `codigo_grupo`, `codigo_organizador` e `travar` booleano. |
| `POST /grupos/sortear` | `codigo_grupo` e `codigo_organizador`. Realiza e persiste o sorteio. |
| `POST /participantes/entrar` | `codigo_grupo` e `nome`, com `email` opcional. Retorna um código pessoal. |
| `DELETE /participantes/remover` | `codigo_grupo`, `codigo_organizador` e `codigo_pessoal`. Remove antes do travamento. |
| `POST /resultado/consultar` | `codigo_grupo` e `codigo_pessoal`. Retorna a atribuição desse participante. |
| `GET /health` | Verifica a conexão e a disponibilidade das tabelas do MySQL. |

## Testes

- `npm test` roda os testes unitários do sorteio sem conectar ao banco.
- `npm run test:integration` exercita as rotas com MySQL. Use as variáveis de `.env.example` apontando para um banco descartável cujo nome termine em `_test`. Os testes verificam permissões, sorteio concorrente e rollback quando a gravação falha.

## Publicar no Railway

Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_DATABASE` a partir do serviço MySQL. Use `npm run db:setup` como comando de pré-deploy, `npm start` para iniciar a aplicação e `/health` para o health check.

Desenvolvido por Carlos Eduardo Alvarenga Goes.
