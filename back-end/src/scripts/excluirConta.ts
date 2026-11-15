import { dbPool } from '@config/database.js';
import { excluirContaPorEmail } from '@common/auth/exclusao.js';

async function excluir(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Uso: npm run conta:excluir -- <email>');
    process.exitCode = 1;
    return;
  }

  if (!(await excluirContaPorEmail(email))) {
    console.error(`Nenhuma conta ativa com o e-mail ${email}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Conta de ${email} excluída: dados pessoais anonimizados e acessos revogados.`);
}

await excluir();
await dbPool.end();
