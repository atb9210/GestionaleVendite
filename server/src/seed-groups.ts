import './config/env';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const GROUPS = [
  { name: 'CLIENTI',      icon: '👥', color: '#6366f1', order: 0 },
  { name: 'CONTACTED',    icon: '💬', color: '#06b6d4', order: 1 },
  { name: 'DA CHIAMARE',  icon: '📞', color: '#f59e0b', order: 2 },
  { name: 'LOW',          icon: '🔴', color: '#ef4444', order: 3 },
  { name: 'PRIORITY',     icon: '⭐', color: '#eab308', order: 4 },
  { name: 'PROPOSAL',     icon: '📋', color: '#8b5cf6', order: 5 },
  { name: 'NURTURE',      icon: '💤', color: '#64748b', order: 6 },
  { name: 'PERSO',        icon: '❌', color: '#dc2626', order: 7 },
  { name: 'WON',          icon: '🤝', color: '#22c55e', order: 8 },
];

async function main() {
  for (const g of GROUPS) {
    const existing = await prisma.conversationGroup.findFirst({ where: { name: g.name } });
    if (!existing) {
      await prisma.conversationGroup.create({ data: g });
      console.log(`Created: ${g.icon} ${g.name}`);
    } else {
      console.log(`Skip (exists): ${g.name}`);
    }
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
