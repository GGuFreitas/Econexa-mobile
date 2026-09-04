import { dbPool } from '@config/database.js';

async function promoverAdmin(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Uso: npm run admin:promover -- <email>');
    process.exitCode = 1;
    return;
  }

  const resultado = await dbPool.query(
    `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, nome, email, role`,
    [email],
  );

  if (resultado.rows.length === 0) {
    console.error(`Nenhum usuário cadastrado com o e-mail ${email}.`);
    process.exitCode = 1;
    return;
  }

  const usuario = resultado.rows[0];
  console.log(`Usuário ${usuario.nome} (id ${usuario.id}) agora tem role "${usuario.role}".`);
}

await promoverAdmin();
await dbPool.end();
