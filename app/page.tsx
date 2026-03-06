"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  TASK_GROUPS,
  Task,
  TaskGroup,
  DailyChecklist,
  getEmptyChecklist,
  getCompletionStats,
} from "@/lib/checklist";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  const tz = "Asia/Taipei";
  const now = toZonedTime(new Date(), tz);
  return format(now, "yyyy-MM-dd");
}

function getTodayDisplay(): string {
  const tz = "Asia/Taipei";
  const now = toZonedTime(new Date(), tz);
  return format(now, "M月d日 EEEE", { locale: zhTW });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#8b5cf6";
  return (
    <div className="progress-bar-wrap">
      <div
        className="progress-bar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  checked: boolean;
  inputValue: string;
  onToggle: (id: string) => void;
  onInput: (id: string, val: string) => void;
}

function TaskRow({ task, checked, inputValue, onToggle, onInput }: TaskRowProps) {
  return (
    <div
      className={`task-row ${checked ? "task-row--done" : ""}`}
      style={{ animationDelay: "0ms" }}
    >
      <button
        className={`checkbox ${checked ? "checkbox--checked" : ""}`}
        onClick={() => onToggle(task.id)}
        aria-label={checked ? "取消勾選" : "勾選"}
      >
        {checked && (
          <svg viewBox="0 0 12 9" fill="none" width="12" height="9">
            <path
              d="M1 4.5L4.5 8L11 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="task-content">
        <span className={`task-label ${checked ? "task-label--done" : ""}`}>
          {task.label}
        </span>
        {task.note && <span className="task-note">{task.note}</span>}

        {task.hasInput && (
          <input
            className="task-input"
            type="text"
            placeholder={task.inputPlaceholder}
            value={inputValue}
            onChange={(e) => onInput(task.id, e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

interface GroupCardProps {
  group: TaskGroup;
  checklist: DailyChecklist;
  onToggle: (id: string) => void;
  onInput: (id: string, val: string) => void;
}

function GroupCard({ group, checklist, onToggle, onInput }: GroupCardProps) {
  const done = group.tasks.filter((t) => checklist.tasks[t.id]).length;
  const total = group.tasks.length;
  const allDone = done === total;

  return (
    <div className={`group-card ${allDone ? "group-card--complete" : ""}`}>
      <div className="group-header">
        <h2 className="group-title">{group.title}</h2>
        <span className={`group-badge ${allDone ? "group-badge--done" : ""}`}>
          {done}/{total}
        </span>
      </div>
      <div className="task-list">
        {group.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            checked={checklist.tasks[task.id] ?? false}
            inputValue={checklist.inputs[task.id] ?? ""}
            onToggle={onToggle}
            onInput={onInput}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dateDisplay, setDateDisplay] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const inputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load checklist from API
  useEffect(() => {
    const date = getTodayDate();
    setTodayDate(date);
    setDateDisplay(getTodayDisplay());
    fetch(`/api/checklist?date=${date}`)
      .then((r) => r.json())
      .then((data: DailyChecklist) => {
        // Merge with empty to ensure all task IDs exist
        const empty = getEmptyChecklist(date);
        setChecklist({
          ...empty,
          ...data,
          tasks: { ...empty.tasks, ...data.tasks },
          inputs: { ...empty.inputs, ...data.inputs },
        });
      })
      .catch(() => setChecklist(getEmptyChecklist(date)));
  }, []);

  // Debounced save
  const saveToServer = useCallback(
    (updated: DailyChecklist) => {
      setSaving(true);
      fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
        .then(() => {
          setLastSaved(format(new Date(), "HH:mm:ss"));
        })
        .catch(console.error)
        .finally(() => setSaving(false));
    },
    []
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (!checklist) return;
      const updated = {
        ...checklist,
        tasks: { ...checklist.tasks, [id]: !checklist.tasks[id] },
      };
      setChecklist(updated);
      saveToServer(updated);
    },
    [checklist, saveToServer]
  );

  const handleInput = useCallback(
    (id: string, val: string) => {
      if (!checklist) return;
      const updated = {
        ...checklist,
        inputs: { ...checklist.inputs, [id]: val },
      };
      setChecklist(updated);
      // Debounce saves for text input
      if (inputTimerRef.current) clearTimeout(inputTimerRef.current);
      inputTimerRef.current = setTimeout(() => saveToServer(updated), 800);
    },
    [checklist, saveToServer]
  );

  if (!checklist) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>載入中...</p>
      </div>
    );
  }

  const { done, total, pct } = getCompletionStats(checklist);

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <div className="header-inner">
          <div>
            <p className="header-date">{dateDisplay}</p>
            <h1 className="header-title">每日健康清單</h1>
          </div>
          <div className="header-right">
            {saving && <span className="save-badge">儲存中...</span>}
            {!saving && lastSaved && (
              <span className="save-badge save-badge--saved">✓ {lastSaved}</span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="progress-section">
          <div className="progress-stats">
            <span className="progress-label">今日進度</span>
            <span className="progress-count">
              <strong>{done}</strong>/{total} 項完成
            </span>
          </div>
          <ProgressBar pct={pct} />
          <div className="progress-pct">{pct}%</div>
        </div>
      </header>

      {/* Groups */}
      <main className="main-content">
        {TASK_GROUPS.map((group, i) => (
          <div
            key={group.id}
            id={group.id}
            style={{
              scrollMarginTop: "130px", // offset for sticky header
              animation: `fadeInUp 0.4s ease both`,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <GroupCard
              group={group}
              checklist={checklist}
              onToggle={handleToggle}
              onInput={handleInput}
            />
          </div>
        ))}

        <div className="footer-note">
          💊 每天按時完成，你是最棒的！
        </div>
      </main>

      <style>{`
        .page {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 0 80px;
          position: relative;
        }

        /* Header */
        .page-header {
          background: rgba(26, 26, 36, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 24px 20px 20px;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 4px 32px rgba(0,0,0,0.3);
        }
        .header-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .header-date {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .header-title {
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #f1f0f5 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .save-badge {
          font-size: 11px;
          color: var(--text-muted);
          padding: 3px 8px;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
        }
        .save-badge--saved {
          color: var(--accent-green);
          border-color: rgba(16,185,129,0.3);
          background: rgba(16,185,129,0.08);
        }

        /* Progress */
        .progress-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .progress-stats {
          display: flex;
          flex-direction: column;
          min-width: 80px;
        }
        .progress-label {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .progress-count {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .progress-count strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .progress-bar-wrap {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease, background 0.3s ease;
          animation: progressFill 0.8s ease;
          position: relative;
        }
        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: shimmer 2s infinite;
        }
        .progress-pct {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 36px;
          text-align: right;
        }

        /* Main */
        .main-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Group Card */
        .group-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .group-card:hover {
          border-color: rgba(139,92,246,0.2);
        }
        .group-card--complete {
          border-color: rgba(16,185,129,0.3);
          background: linear-gradient(135deg, #1a1a24 0%, rgba(16,185,129,0.04) 100%);
        }
        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid var(--border);
        }
        .group-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .group-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          background: rgba(139,92,246,0.15);
          color: var(--accent);
          border: 1px solid rgba(139,92,246,0.25);
          letter-spacing: 0.3px;
        }
        .group-badge--done {
          background: rgba(16,185,129,0.15);
          color: var(--accent-green);
          border-color: rgba(16,185,129,0.3);
        }
        .task-list {
          padding: 8px 0;
        }

        /* Task Row */
        .task-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 16px;
          transition: background 0.15s;
          cursor: pointer;
        }
        .task-row:hover {
          background: rgba(255,255,255,0.03);
        }
        .task-row--done {
          background: rgba(16,185,129,0.04);
        }
        .task-row + .task-row {
          border-top: 1px solid rgba(255,255,255,0.04);
        }

        /* Checkbox */
        .checkbox {
          width: 22px;
          height: 22px;
          min-width: 22px;
          border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.15);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 1px;
        }
        .checkbox:hover {
          border-color: var(--accent);
          background: var(--accent-glow);
        }
        .checkbox--checked {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          border-color: transparent;
          box-shadow: 0 0 0 2px rgba(139,92,246,0.25);
          animation: checkPop 0.25s ease;
        }

        /* Task content */
        .task-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .task-label {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
          transition: color 0.2s, opacity 0.2s;
        }
        .task-label--done {
          color: var(--text-muted);
          text-decoration: line-through;
          text-decoration-color: rgba(255,255,255,0.2);
        }
        .task-note {
          font-size: 11px;
          color: var(--accent);
          background: var(--accent-glow);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 4px;
          padding: 2px 6px;
          align-self: flex-start;
          letter-spacing: 0.2px;
        }
        .task-input {
          margin-top: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 13px;
          color: var(--text-primary);
          font-family: inherit;
          width: 100%;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        .task-input:focus {
          border-color: var(--accent);
          background: rgba(139,92,246,0.08);
        }
        .task-input::placeholder {
          color: var(--text-muted);
        }

        /* Footer */
        .footer-note {
          text-align: center;
          padding: 24px 16px;
          font-size: 13px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        /* Loading */
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(139,92,246,0.15);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
