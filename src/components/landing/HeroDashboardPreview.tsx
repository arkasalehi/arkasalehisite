const hostSrc = "/samples/collab/host.jpg";
const peerASrc = "/samples/collab/peer-a.jpg";
const peerBSrc = "/samples/collab/peer-b.jpg";

export function HeroDashboardPreview() {
  return (
    <div className="hero-saas pointer-events-none relative mx-auto w-[min(1200px,96%)] rounded-[32px] border border-white/55 bg-white/35 p-3 shadow-[0_28px_60px_rgba(20,60,100,0.12)] backdrop-blur-2xl sm:p-4">
      <div className="rounded-[22px] bg-[#f4f6f2]/95 p-3 ring-1 ring-white/40 sm:p-4">
        <div className="flex text-left text-[#1e2a24]">
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <div className="mt-3 flex flex-1">
              <Sidebar />
              <div className="min-w-0 flex-1 space-y-3 px-2 sm:px-3">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_272px]">
                  <VideoStage />
                  <AiSummary />
                </div>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_272px]">
                  <CalendarPanel />
                  <div className="grid gap-3">
                    <InsightCard />
                    <InviteCard />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <RightRail />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#3390ec] text-white">
        <BellIcon />
      </span>
      <div className="hidden items-center gap-1.5 md:flex">
        <span className="grid h-7 w-7 place-items-center rounded-lg text-[#6d7871]">
          <HomeIcon />
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white shadow-sm">
          <span className="h-3.5 w-3.5 rounded-full bg-[conic-gradient(#8b5cf6,#fb7185,#f59e0b,#8b5cf6)]" />
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#3390ec] text-[11px] text-white">✸</span>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#6366f1] text-[10px] font-bold text-white">≡</span>
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#e3e7e1] text-[#8b938d]">+</span>
      </div>
      <span className="hidden h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-medium shadow-sm lg:inline-flex">
        <span className="text-[#3390ec]">+</span> Create
      </span>
      <span className="hidden text-[#8b938d] lg:grid">
        <BellIcon />
      </span>
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12px] text-[#8b938d] shadow-sm">
        <SearchIcon />
        Search anything...
      </div>
    </div>
  );
}

function Sidebar() {
  const dms = [
    { name: "Jerry Moore", badge: "2" },
    { name: "Kenneth Smith" },
    { name: "Angela Brown" },
    { name: "Amanda Hall", badge: "1" },
    { name: "Ryan Miller" },
    { name: "Ashley Stewart" },
    { name: "Raymond Diaz" },
  ];

  return (
    <aside className="hidden w-[208px] shrink-0 flex-col pr-1 lg:flex">
      <p className="px-2 text-[11px] text-[#8b938d]">General</p>
      <NavRow label="Overview" />
      <NavRow label="Meeting Space" active />
      <NavRow label="My Task" />
      <NavRow label="Directories" />
      <NavRow label="Archived" />

      <p className="mt-4 px-2 text-[11px] text-[#8b938d]">Spotlight</p>
      <div className="mt-1 flex items-center gap-2 px-2 py-1.5 text-[12px]">
        <span className="rounded bg-[#e11d48] px-1 py-px text-[8px] font-bold text-white">PDF</span>
        Project-brief.pdf
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5 text-[12px]">
        <span className="h-5 w-5 rounded-full bg-[#c4b5a5]" />
        Joshua Orlando
      </div>

      <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-[#8b938d]">
        Group <span>+</span>
      </div>
      <NavRow label="General" />
      <NavRow label="Designer Spot" />
      <NavRow label="Report Only" />

      <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-[#8b938d]">
        Direct Messages <span>+</span>
      </div>
      <ul className="mt-1 space-y-0.5">
        {dms.map((dm, i) => (
          <li key={dm.name} className="flex items-center gap-2 rounded-xl px-2 py-1 text-[12px]">
            <span
              className="h-5 w-5 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${[hostSrc, peerASrc, peerBSrc, hostSrc, peerASrc, peerBSrc, hostSrc][i]})` }}
            />
            <span className="flex-1 truncate">{dm.name}</span>
            {dm.badge ? (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#3390ec] px-1 text-[9px] text-white">
                {dm.badge}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function NavRow({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={`mt-0.5 flex items-center gap-2 rounded-xl px-2 py-1.5 text-[12.5px] ${
        active ? "bg-[#e7ebe4] font-medium" : "text-[#3d4741]"
      }`}
    >
      <span className="grid h-4 w-4 place-items-center text-[#7a847e]">
        {active ? <CamIcon /> : <DotIcon />}
      </span>
      {label}
    </div>
  );
}

function VideoStage() {
  return (
    <div className="grid h-[270px] gap-2 sm:grid-cols-[minmax(0,1.45fr)_168px]">
      <div className="relative overflow-hidden rounded-2xl bg-[#d7dbd4]">
        <img src={hostSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
          <span className="h-4 w-4 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${hostSrc})` }} />
          Kenneth Smith (Host)
        </span>
      </div>
      <div className="grid grid-rows-2 gap-2">
        <VideoTile src={peerASrc} name="Kenneth Smith" />
        <VideoTile src={peerBSrc} name="Angela Brown" />
      </div>
    </div>
  );
}

function VideoTile({ src, name }: { src: string; name: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#d7dbd4]">
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">{name}</span>
    </div>
  );
}

function AiSummary() {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-end gap-2 text-[#8b938d]">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f3f5f1]">⋮</span>
        <span className="h-8 w-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${hostSrc})` }} />
      </div>
      <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8b938d]">AI SUMMARY</p>
      <p className="mt-1 text-[11px] text-[#8b938d]">FOR THE WEEK OF DEC 15–21</p>
      <p className="mt-3 text-[13px] leading-5">
        Today’s focus is on the <span className="font-semibold">Alpha release</span>. The team is feeling confident but is
        slightly behind on the documentation.
      </p>
      <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[#3d4741]">
        <li className="flex gap-2">
          <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#3390ec] text-[9px] text-white">✓</span>
          <span>
            <b>Sarah:</b> Complete the remaining 10% of server migration.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 h-4 w-4 rounded-full border border-[#cfd6d0]" />
          <span>
            <b>Creative Team:</b> Send final PNG assets to Mark by 2:00 PM.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 h-4 w-4 rounded-full border border-[#cfd6d0]" />
          <span>
            <b>Admin:</b> Schedule the follow-up sync for 4:30 PM.
          </span>
        </li>
      </ul>
      <p className="mt-4 text-right text-[11px] text-[#8b938d]">Page 8</p>
    </div>
  );
}

function CalendarPanel() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const nums = ["20", "21", "22", "23", "24", "25", "26"];
  const meetings = [
    { title: "Product Sync Meeting", time: "09:00 – 09:30", team: "Design, Product", status: "Ongoing", color: "#e11d48" },
    { title: "Client Review: Dashboard v2", time: "11:00 – 12:00", team: "Client, Design Team", status: "Upcoming" },
    { title: "Internal UX Review", time: "14:00 – 14:45", team: "UX Team", status: "Upcoming" },
    { title: "Weekly Planning Check-in", time: "16:30 – 17:00", team: "Project Team", status: "Upcoming" },
  ];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-center text-[14px] font-semibold">January, 2025 ▾</p>
      <div className="mt-3 grid grid-cols-7 text-center">
        {days.map((d, i) => (
          <div key={d} className="text-[11px]">
            <p className="text-[#8b938d]">{d}</p>
            <p className="mt-1 text-[15px] font-medium">{nums[i]}</p>
            {i === 3 ? <span className="mx-auto mt-1 block h-1 w-4 rounded-full bg-[#3390ec]" /> : null}
            {i === 4 ? <span className="mx-auto mt-1 block h-1 w-3 rounded-full bg-[#cfd6d0]" /> : null}
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {meetings.map((m) => (
          <li key={m.title} className="flex items-center justify-between rounded-xl bg-[#f6f7f4] px-3 py-2.5">
            <div>
              <p className="text-[13px] font-medium">{m.title}</p>
              <p className="text-[11px] text-[#8b938d]">
                {m.time} · {m.team}
              </p>
            </div>
            <span className="flex items-center gap-2 text-[11px] font-medium" style={{ color: m.color ?? "#3390ec" }}>
              {m.status}
              <span className="h-4 w-4 rounded bg-gradient-to-br from-[#818cf8] to-[#34d399]" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-[12px] font-medium text-[#8b938d]">Insight</p>
      <p className="mt-1 text-[28px] font-semibold leading-none text-[#3390ec]">93%</p>
      <p className="mt-2 text-[12px] leading-5 text-[#5b655f]">
        Is your meeting attendance rate based on your activity for the week of Dec 15–21.
      </p>
      <p className="mt-2 text-[12px] leading-5 text-[#5b655f]">
        You’re doing great this month! You have attended 12 out of 14 scheduled meetings. Keep it up!
      </p>
    </div>
  );
}

function InviteCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold leading-5">
            You’ve got 2
            <br />
            meeting invites
          </p>
          <p className="mt-2 text-[12px] leading-5 text-[#8b938d]">Take a moment to review your new meeting invitations.</p>
        </div>
        <div className="flex -space-x-2">
          {[hostSrc, peerASrc, peerBSrc].map((src) => (
            <span key={src} className="h-7 w-7 rounded-full border-2 border-white bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
          ))}
        </div>
      </div>
      <span className="mt-4 inline-flex h-9 items-center rounded-full bg-[#3390ec] px-4 text-[12px] font-medium text-white">
        Review Invitation
      </span>
    </div>
  );
}

function RightRail() {
  return (
    <aside className="ml-1 hidden w-[52px] shrink-0 flex-col items-center gap-3 pt-1 xl:flex">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6d7871] shadow-sm">▢</span>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6d7871] shadow-sm">◎</span>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6d7871] shadow-sm">☰</span>
      <span className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-[#e11d48] text-[10px] text-white">●</span>
      <span className="mt-auto grid h-9 w-9 place-items-center rounded-xl bg-[#3390ec] text-lg text-white">+</span>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6d7871] shadow-sm">≡</span>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6d7871] shadow-sm">⌂</span>
    </aside>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function CamIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </svg>
  );
}

function DotIcon() {
  return <span className="h-1.5 w-1.5 rounded-full bg-[#c5cdc6]" />;
}
