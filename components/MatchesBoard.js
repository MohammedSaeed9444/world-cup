"use client";

import { useState } from "react";
import MatchCard from "@/components/MatchCard";

/**
 * Tabbed match board — splits fixtures into Upcoming / Locked / Finished tabs.
 * Receives all matches + predictions from the server and filters client-side.
 */
export default function MatchesBoard({ matches, predictionsByMatchId }) {
  const [activeTab, setActiveTab] = useState("upcoming");

  const now = new Date();

  const upcoming = matches.filter(
    (m) =>
      !m.is_finished &&
      new Date(m.prediction_deadline ?? m.match_time) > now
  );
  const locked = matches.filter(
    (m) =>
      !m.is_finished &&
      new Date(m.prediction_deadline ?? m.match_time) <= now
  );
  const finished = matches.filter((m) => m.is_finished);

  const tabs = [
    {
      id: "upcoming",
      label: "Upcoming",
      icon: "📅",
      count: upcoming.length,
      color: "emerald",
    },
    {
      id: "locked",
      label: "In Progress",
      icon: "🔒",
      count: locked.length,
      color: "red",
    },
    {
      id: "finished",
      label: "Finished",
      icon: "✅",
      count: finished.length,
      color: "amber",
    },
  ];

  const displayed =
    activeTab === "upcoming"
      ? upcoming
      : activeTab === "locked"
        ? locked
        : finished;

  const emptyMessages = {
    upcoming: "No upcoming matches. Check back soon!",
    locked: "No matches currently in progress.",
    finished: "No finished matches yet.",
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const activeStyles = {
            emerald: "border-emerald-500 bg-emerald-900/30 text-emerald-300",
            red: "border-red-500 bg-red-900/30 text-red-300",
            amber: "border-amber-500 bg-amber-900/30 text-amber-300",
          };
          const inactiveStyles =
            "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300";

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                isActive ? activeStyles[tab.color] : inactiveStyles
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive ? "bg-white/10" : "bg-zinc-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Match grid */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 py-12 text-center">
          <p className="text-zinc-500">{emptyMessages[activeTab]}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictionsByMatchId[match.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
