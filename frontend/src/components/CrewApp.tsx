"use client";

import { useState } from "react";
import { Masthead } from "./Masthead";
import { Nav, type TabKey } from "./Nav";
import { Footer } from "./Footer";
import { useStatuses } from "@/lib/useStatuses";
import { TodayTab } from "./tabs/TodayTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { DeliverablesTab } from "./tabs/DeliverablesTab";
import { InterviewsTab } from "./tabs/InterviewsTab";
import { DelegatesTab } from "./tabs/DelegatesTab";
import { TitleholdersTab } from "./tabs/TitleholdersTab";
import { ContactsTab } from "./tabs/ContactsTab";

export function CrewApp() {
  const [active, setActive] = useState<TabKey>("today");
  // Created once at the top so the realtime subscription stays alive across tabs.
  const statuses = useStatuses();
  // Cross-navigation: jump straight to a deliverable from Today / Schedule.
  const [focusDeliverable, setFocusDeliverable] = useState<string | null>(null);

  const openDeliverable = (id: string) => {
    setFocusDeliverable(id);
    setActive("deliverables");
  };

  return (
    <div className="min-h-screen pb-[max(env(safe-area-inset-bottom),0px)]">
      <Masthead />
      <Nav active={active} onChange={setActive} />
      <main className="mx-auto max-w-3xl px-4 py-5">
        {active === "today" && <TodayTab onOpenDeliverable={openDeliverable} />}
        {active === "schedule" && (
          <ScheduleTab onOpenDeliverable={openDeliverable} />
        )}
        {active === "deliverables" && (
          <DeliverablesTab
            statuses={statuses}
            focusId={focusDeliverable}
            onFocusHandled={() => setFocusDeliverable(null)}
          />
        )}
        {active === "interviews" && <InterviewsTab />}
        {active === "delegates" && <DelegatesTab />}
        {active === "titleholders" && <TitleholdersTab />}
        {active === "contacts" && <ContactsTab />}
      </main>
      <Footer />
    </div>
  );
}
