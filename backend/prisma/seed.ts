/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar roles do sistema
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrador - Acesso total à plataforma',
        permissions: JSON.stringify([
          'platform:manage',
          'companies:create',
          'companies:read',
          'companies:update',
          'companies:delete',
          'users:create',
          'users:read',
          'users:update',
          'users:delete',
          'billing:manage',
          'system:configure',
        ]),
      },
    }),
    prisma.role.upsert({
      where: { name: 'COMPANY_OWNER' },
      update: {},
      create: {
        name: 'COMPANY_OWNER',
        description: 'Proprietário da Empresa - Acesso total à empresa',
        permissions: JSON.stringify([
          'company:manage',
          'users:invite',
          'users:manage',
          'whatsapp:manage',
          'flows:manage',
          'tickets:manage',
          'billing:view',
          'settings:manage',
        ]),
      },
    }),
    prisma.role.upsert({
      where: { name: 'COMPANY_ADMIN' },
      update: {},
      create: {
        name: 'COMPANY_ADMIN',
        description: 'Administrador da Empresa - Acesso administrativo',
        permissions: JSON.stringify([
          'users:invite',
          'users:view',
          'whatsapp:manage',
          'flows:manage',
          'tickets:manage',
          'settings:manage',
        ]),
      },
    }),
    prisma.role.upsert({
      where: { name: 'COMPANY_AGENT' },
      update: {},
      create: {
        name: 'COMPANY_AGENT',
        description: 'Agente de Atendimento - Atendimento ao cliente',
        permissions: JSON.stringify([
          'tickets:view',
          'tickets:update',
          'tickets:respond',
          'contacts:view',
          'flows:view',
        ]),
      },
    }),
    prisma.role.upsert({
      where: { name: 'COMPANY_VIEWER' },
      update: {},
      create: {
        name: 'COMPANY_VIEWER',
        description: 'Visualizador - Apenas leitura',
        permissions: JSON.stringify([
          'dashboard:view',
          'tickets:view',
          'contacts:view',
          'reports:view',
        ]),
      },
    }),
  ]);

  console.log(`✅ Criados ${roles.length} roles:`);
  roles.forEach((role) => {
    console.log(`  - ${role.name}: ${role.description}`);
  });

  // Criar usuário Super Admin
  const superAdminRole = roles.find((role) => role.name === 'SUPER_ADMIN');

  if (superAdminRole) {
    const superAdminEmail = 'admin@ticketrobot.com';
    const superAdminPassword = 'Admin123!'; // Senha temporária - deve ser alterada no primeiro login

    // Verificar se super admin já existe
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!existingSuperAdmin) {
      // Hash da senha temporária
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

      // Criar empresa padrão para o Super Admin
      const adminCompany = await prisma.company.create({
        data: {
          name: 'Ticket Robot Admin',
          slug: 'ticket-robot-admin',
          plan: 'ENTERPRISE',
          maxUsers: 999,
          maxSessions: 999,
        },
      });

      // Criar usuário Super Admin
      const superAdminUser = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          name: 'Super Administrator',
          isFirstLogin: true, // Força mudança de senha no primeiro login
        },
      });

      // Associar Super Admin à empresa
      await prisma.companyUser.create({
        data: {
          userId: superAdminUser.id,
          companyId: adminCompany.id,
          roleId: superAdminRole.id,
        },
      });

      console.log('✅ Super Admin criado com sucesso:');
      console.log(`  📧 Email: ${superAdminEmail}`);
      console.log(`  🔑 Senha temporária: ${superAdminPassword}`);
      console.log('  ⚠️  IMPORTANTE: Altere a senha no primeiro login!');
    } else {
      console.log('ℹ️  Super Admin já existe, pulando criação...');
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
