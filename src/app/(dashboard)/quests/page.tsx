import { prisma } from "@/lib/db";
import { QuestsList } from "./QuestsList";

export default async function QuestsPage() {
  const sites = await prisma.site.findMany({
    select: { id: true, name: true, villageName: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Görev Loncası
        </h1>
        <p className="text-sm text-parchment-dim mt-1">
          Tüm görevleri yönet, takip et ve tamamla
        </p>
      </div>
      <QuestsList sites={sites} />
    </div>
  );
}
