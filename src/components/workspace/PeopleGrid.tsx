"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { ChatAvatar } from "@/components/workspace/ChatAvatar";
import { EmptyState } from "@/components/workspace/EmptyState";
import type { StudioPerson } from "@/lib/data/studio";
import { chatAvatarColor } from "@/lib/workspace/chat";
import { useWsChrome } from "@/lib/theme/workspace";

export function PeopleGrid({ people, userId, embedded = false }: { people: StudioPerson[]; userId: string; embedded?: boolean }) {
  const { t } = useWsChrome();
  const router = useRouter();

  async function message(personId: string) {
    const res = await fetch("/api/workspace/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "dm", withUserId: personId }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    if (res.ok && data.id) router.push(`/ws/chat/${data.id}`);
  }

  if (!people.length) {
    if (embedded) return null;
    return <EmptyState icon={<Users className="h-5 w-5" />} title={t.collaborators} body={t.noChatsBody} />;
  }

  return (
    <section id="people" className={embedded ? "mt-8" : "ws-scroll h-full overflow-auto p-4"}>
      <h2 className={embedded ? "mb-3 text-[16px] font-semibold" : "ws-title mb-4"}>{t.people}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => (
          <article key={person.id} className="ws-card">
            <div className="flex items-center gap-3">
              <span className="relative">
                <ChatAvatar name={person.displayName} url={person.avatarUrl} color={chatAvatarColor(person.id)} size={48} />
                <span className={`absolute bottom-0 end-0 h-3 w-3 rounded-full ring-2 ring-[var(--theme-comp-header-color)] ${person.online ? "bg-emerald-400" : "bg-zinc-500"}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{person.displayName || person.username}</p>
                <p className="text-[12px] text-[var(--theme-darker-color)]">
                  @{person.username || "user"} · {person.online ? t.online : t.offline}
                </p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
              <div>
                <dt className="text-[var(--theme-darker-color)]">{t.performance}</dt>
                <dd className="font-semibold">{person.performance}%</dd>
              </div>
              <div>
                <dt className="text-[var(--theme-darker-color)]">{t.attendance}</dt>
                <dd className="font-semibold">{person.attendance == null ? "—" : `${person.attendance}%`}</dd>
              </div>
              <div>
                <dt className="text-[var(--theme-darker-color)]">{t.tasksNav}</dt>
                <dd className="font-semibold">{person.openTasks}</dd>
              </div>
            </dl>
            {person.projectNames.length ? <p className="mt-2 truncate text-[12px] text-[var(--theme-dark-color)]">{person.projectNames.join(" · ")}</p> : null}
            {person.id !== userId ? (
              <button type="button" className="ws-btn ws-btn-primary mt-3 w-full" onClick={() => void message(person.id)}>
                {t.message}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
