# Amigo Secreto – Backend API

API REST desenvolvida em **Node.js + Express + MySQL** para gerenciamento completo de um sistema de **Amigo Secreto**, com regras de negócio bem definidas, controle de acesso e middlewares personalizados.

Este projeto foi criado com foco em **boas práticas de backend**, **organização de código** e **validações reais de negócio**.

---

## Funcionalidades

### Grupos

* Criar grupo de amigo secreto
* Definir quantidade máxima de participantes (**apenas números pares**)
* Gerar **código do grupo** e **código do organizador**
* Travar e destravar grupo (**apenas organizador**)
* Impedir alterações após o sorteio

### Participantes

* Entrar em grupo usando código
* Impedir entrada em grupo travado
* Impedir e-mails duplicados no mesmo grupo
* Remover participante (**apenas organizador**)

### Sorteio

* Sorteio automático sem permitir que alguém tire a si mesmo
* Sorteio permitido apenas quando:

  * o grupo estiver **travado**
  * o número de participantes for **exatamente o máximo definido**
* Bloqueio de novo sorteio após conclusão

### Resultados

* Consulta de resultado individual usando **código pessoal**
* Segurança: cada participante visualiza **apenas o próprio resultado**

---

## Regras de Negócio Implementadas

* Grupos aceitam apenas **número par** de participantes
* Grupo travado **não aceita novos participantes**
* Apenas o organizador pode:

  * travar ou destravar o grupo
  * remover participantes
  * realizar o sorteio
* Após o sorteio:

  * o grupo **não pode ser destravado**
  * os participantes **não podem ser alterados**

---

## Arquitetura do Projeto

```text
src/
 ├── config/
 │   └── db.js
 ├── controllers/
 │   ├── grupoController.js
 │   ├── participanteController.js
 │   └── resultadoController.js
 ├── middlewares/
 │   ├── validarOrganizador.js
 │   ├── bloquearGrupoTravado.js
 │   └── errorHandler.js
 ├── routes/
 │   ├── grupoRoutes.js
 │   ├── participanteRoutes.js
 │   └── resultadoRoutes.js
 └── server.js
```

---

## Middlewares Personalizados

### validarOrganizador

Garante que apenas o organizador execute ações sensíveis do grupo.

### bloquearGrupoTravado

Impede qualquer ação em grupos que já estejam travados.

### errorHandler

Centraliza o tratamento de erros da aplicação, evitando repetição de código nos controllers.

---

## Tecnologias Utilizadas

* **Node.js**
* **Express**
* **MySQL**
* **dotenv**
* **crypto**
* **Nodemon** (ambiente de desenvolvimento)

---

## Como Executar o Projeto

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar arquivo `.env`

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=amigo_secreto
```

### 4. Rodar o servidor

```bash
npm run dev
```

Servidor disponível em:

```
http://localhost:3000
```

---

## Status do Projeto

* Backend finalizado
* Regras de negócio completas
* Pronto para integração com front-end ou consumo via API

---

## Autor: Carlos Eduardo Alvarenga Goes

Projeto desenvolvido para fins de **aprendizado, portfólio e demonstração de domínio em backend**, com foco em lógica de negócio, validações, middlewares e organização de código.


