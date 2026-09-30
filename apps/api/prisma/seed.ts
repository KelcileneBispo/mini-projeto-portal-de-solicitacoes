import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { RequestCategory, RequestStatus } from '../generated/prisma/client.js';
import { hashPassword } from '../src/auth/password.js';
import { createPrismaClient } from '../src/prisma/create-prisma-client.js';

/**
 * Credenciais somente de desenvolvimento. Não reutilizar fora da máquina local.
 */
const users = [
  {
    username: 'ana',
    name: 'Ana Souza',
    password: 'dev-ana-123',
  },
  {
    username: 'bruno',
    name: 'Bruno Lima',
    password: 'dev-bruno-123',
  },
  {
    username: 'carla',
    name: 'Carla Mendes',
    password: 'dev-carla-123',
  },
] as const;

const requests = [
  {
    username: 'ana',
    title: 'Acesso à VPN corporativa',
    description:
      'Preciso de acesso à VPN para trabalhar remotamente nesta semana.',
    category: RequestCategory.TI,
    status: RequestStatus.ABERTO,
  },
  {
    username: 'ana',
    title: 'Atualização de dados cadastrais',
    description:
      'Meu endereço e meu contato de emergência estão desatualizados no cadastro.',
    category: RequestCategory.RH,
    status: RequestStatus.EM_ATENDIMENTO,
  },
  {
    username: 'bruno',
    title: 'Compra de headset para atendimento',
    description:
      'O headset atual falha nas ligações e preciso de um substituto para o posto.',
    category: RequestCategory.COMPRAS,
    status: RequestStatus.ABERTO,
  },
  {
    username: 'bruno',
    title: 'Reembolso de transporte',
    description:
      'Solicito o reembolso do deslocamento feito para a visita ao fornecedor.',
    category: RequestCategory.FINANCEIRO,
    status: RequestStatus.CONCLUIDO,
  },
  {
    username: 'carla',
    title: 'Reparo do ar-condicionado da sala 2',
    description:
      'O ar-condicionado da sala 2 não gela e o ambiente está impróprio para o expediente.',
    category: RequestCategory.INFRAESTRUTURA,
    status: RequestStatus.EM_ATENDIMENTO,
  },
  {
    username: 'carla',
    title: 'Troca de monitor',
    description:
      'O monitor apresenta faixas na tela e dificulta a leitura das planilhas.',
    category: RequestCategory.TI,
    status: RequestStatus.CONCLUIDO,
  },
] as const;

async function main(): Promise<void> {
  const seedDirectory = dirname(fileURLToPath(import.meta.url));
  loadEnv({ path: resolve(seedDirectory, '../../../.env') });

  const passwordHashes = new Map<string, string>();

  for (const user of users) {
    passwordHashes.set(user.username, await hashPassword(user.password));
  }

  const prisma = createPrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        const passwordHash = passwordHashes.get(user.username);

        if (!passwordHash) {
          throw new Error(
            `Hash bcrypt ausente para o usuário de desenvolvimento ${user.username}.`,
          );
        }

        await tx.user.upsert({
          where: { username: user.username },
          update: {
            name: user.name,
            passwordHash,
          },
          create: {
            username: user.username,
            name: user.name,
            passwordHash,
          },
        });
      }

      for (const request of requests) {
        const requester = await tx.user.findUniqueOrThrow({
          where: { username: request.username },
        });
        const existing = await tx.request.findFirst({
          where: {
            title: request.title,
            requesterId: requester.id,
          },
        });
        const data = {
          description: request.description,
          category: request.category,
          status: request.status,
        };

        if (existing) {
          await tx.request.update({
            where: { id: existing.id },
            data,
          });
          continue;
        }

        await tx.request.create({
          data: {
            ...data,
            title: request.title,
            requesterId: requester.id,
          },
        });
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

await main();
