import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建默认用户...');

  const users = [
    {
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@voc.local',
      role: 'admin',
    },
    {
      username: 'pm',
      password: 'pm123456',
      name: '产品经理',
      email: 'pm@voc.local',
      role: 'productManager',
    },
    {
      username: 'analyst',
      password: 'analyst123',
      name: '数据分析师',
      email: 'analyst@voc.local',
      role: 'dataAnalyst',
    },
    {
      username: 'operator',
      password: 'op123456',
      name: '运营人员',
      email: 'operator@voc.local',
      role: 'operator',
    },
    {
      username: 'cs',
      password: 'cs123456',
      name: '客服人员',
      email: 'cs@voc.local',
      role: 'customerService',
    },
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existing) {
      console.log(`用户 ${userData.username} 已存在，跳过`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'active',
      },
    });

    console.log(`已创建用户: ${userData.username} (${userData.name}) - 角色: ${userData.role}`);
  }

  console.log('默认用户创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
