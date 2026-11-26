const { readFile } = require('node:fs/promises');
const path = require('node:path');
const db = require('../src/config/db');

async function prepararBanco() {
  const schema = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  for (const comando of schema.split(';').map(parte => parte.trim()).filter(Boolean)) {
    await db.query(comando);
  }
}

if (require.main === module) {
  prepararBanco()
    .then(() => console.log('Schema do Amigo Secreto pronto.'))
    .catch(erro => {
      console.error('Não foi possível preparar o schema:', erro.code || erro.name);
      process.exitCode = 1;
    })
    .finally(() => db.end());
}

module.exports = prepararBanco;
