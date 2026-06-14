"use client";

import { useState } from "react";
import { MISS, TEEN } from "@/lib/data";
import type { Delegate } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PillToggle } from "../primitives";

type Group = "miss" | "teen";

function isWithdrew(name: string) {
  return name.trim().toUpperCase() === "WITHDREW";
}

export function DelegatesTab() {
  const [group, setGroup] = useState<Group>("miss");
  const rows: Delegate[] = group === "miss" ? MISS : TEEN;

  return (
    <div className="space-y-4">
      <PillToggle<Group>
        options={[
          { value: "miss", label: "Miss", count: MISS.length },
          { value: "teen", label: "Teen", count: TEEN.length },
        ]}
        value={group}
        onChange={setGroup}
      />

      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-ink/40">
              <th className="w-[58px] px-3 py-2.5 font-semibold">#</th>
              <th className="px-2 py-2.5 font-semibold">Name</th>
              <th className="px-3 py-2.5 font-semibold">Title</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const withdrew = isWithdrew(r[1]);
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-t border-line/60 align-top",
                    withdrew && "opacity-45"
                  )}
                >
                  <td className="px-3 py-2.5 text-[11.5px] font-semibold tabular-nums text-crown-deep">
                    {r[0]}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2.5 text-[13px] font-medium leading-snug text-ink",
                      withdrew && "line-through"
                    )}
                  >
                    {r[1]}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-[12px] leading-snug text-ink/55",
                      withdrew && "line-through"
                    )}
                  >
                    {r[2]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
