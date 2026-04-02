import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SITES_CONFIG, ACHIEVEMENTS_CONFIG } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { username: "cafer" },
    update: {},
    create: {
      username: "cafer",
      passwordHash,
      level: 1,
      xp: 0,
      title: "Çırak Koruyucu",
    },
  });
  console.log("✅ Admin user created (cafer / admin123)");

  // Create sites
  for (const site of SITES_CONFIG) {
    await prisma.site.upsert({
      where: { id: site.name },
      update: { ...site },
      create: { id: site.name, ...site },
    });
  }
  console.log(`✅ ${SITES_CONFIG.length} sites created`);

  // Create achievements
  for (const achievement of ACHIEVEMENTS_CONFIG) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: { ...achievement },
      create: { ...achievement },
    });
  }
  console.log(`✅ ${ACHIEVEMENTS_CONFIG.length} achievements created`);

  // Create initial activity log
  await prisma.activityLog.create({
    data: {
      type: "system",
      message: "Kale kapıları açıldı! Sunucu yönetim paneli aktif.",
      metadata: { event: "initialization" },
    },
  });
  console.log("✅ Initial activity log created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
