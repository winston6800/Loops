import React, { useState, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function PopupApp() {
  // Hydration-safe state initialization
  const [hourlyRate, setHourlyRate] = useState<number>(90);
  const [timer, setTimer] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [taskHistory, setTaskHistory] = useState<{ name: string; amount: string; timestamp: number; duration?: number }[]>([]);
  const [page, setPage] = useState(0); // 0 = main, 1 = history

  // On mount, load state from localStorage (browser only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("burnEngine_hourlyRate");
      if (savedRate) setHourlyRate(Number(savedRate));
      const savedTimer = localStorage.getItem("burnEngine_timer");
      if (savedTimer) setTimer(Number(savedTimer));
      const savedTask = localStorage.getItem("burnEngine_currentTask");
      if (savedTask) setCurrentTask(savedTask);
      const savedHistory = localStorage.getItem("burnEngine_taskHistory");
      if (savedHistory) setTaskHistory(JSON.parse(savedHistory));
      setHasLoaded(true);
    }
  }, []);

  const startTimeRef = useRef<number | null>(null);

  // Start timer interval only after timer is loaded
  useEffect(() => {
    if (!hasLoaded) return;
    startTimeRef.current = Date.now() - timer * 1000;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimer(elapsedSeconds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasLoaded, timer]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_hourlyRate", hourlyRate.toString())
    }
  }, [hourlyRate])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_timer", timer.toString())
    }
  }, [timer])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_currentTask", currentTask)
    }
  }, [currentTask])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_taskHistory", JSON.stringify(taskHistory))
    }
  }, [taskHistory])

  const moneySpent = ((timer / 3600) * hourlyRate).toFixed(2)
  const perMinuteSpent = (hourlyRate / 60).toFixed(2)
  const perSecondSpent = (hourlyRate / 3600).toFixed(2)

  const handleReset = () => {
    setTimer(0)
    startTimeRef.current = null
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_timer", "0")
    }
  }

  // Handle finishing a task
  const handleFinishTask = () => {
    if (currentTask.trim()) {
      setTaskHistory([
        {
          name: currentTask,
          amount: moneySpent,
          timestamp: Date.now(),
          duration: timer, // store duration in seconds
        },
        ...taskHistory,
      ]);
    }
    setCurrentTask("");
    setTimer(0);
    startTimeRef.current = Date.now();
  };

  // Prepare data for cumulative line chart
  const chartData = (() => {
    // Group by day
    const dayCounts: Record<string, number> = {};
    taskHistory.forEach((task) => {
      const day = new Date(task.timestamp).toLocaleDateString();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    // Build array for chart
    return Object.keys(dayCounts)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((day) => ({ day, count: dayCounts[day] }));
  })();

  if (!hasLoaded) return null;

  return (
    <div style={{ minWidth: 350, minHeight: 600, background: "#f8f9fa", padding: 16, fontFamily: "Inter, sans-serif" }}>
      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setPage(0)} disabled={page === 0} style={{ background: "none", border: "none", cursor: page === 0 ? "default" : "pointer", color: page === 0 ? "#3498db" : "#bbb", fontSize: 20, marginRight: 8 }} title="Main">
          <FaArrowLeft />
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: page === 0 ? "#3498db" : "#ccc", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: page === 1 ? "#3498db" : "#ccc", display: "inline-block" }} />
        </div>
        <button onClick={() => setPage(1)} disabled={page === 1} style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "#3498db" : "#bbb", fontSize: 20, marginLeft: 8 }} title="History">
          <FaArrowRight />
        </button>
      </div>
      {/* Page 1: Main timer and chart */}
      {page === 0 && (
        <>
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Your hourly value</span>
              <input
                type="number"
                value={hourlyRate}
                min={1}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                style={{ width: 70, border: "1px solid #ddd", borderRadius: 4, padding: "2px 6px", fontWeight: 600, marginLeft: 8 }}
              />
              <span style={{ marginLeft: 4, fontWeight: 500, color: "#888" }}>$ / hr</span>
              <span style={{ marginLeft: "auto", color: Number(moneySpent) > 0 ? "#e74c3c" : "#333", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 16 }}>
                -${moneySpent}
              </span>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Work on the one thing</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                style={{ flex: 1, border: "none", background: "#f5f5f5", borderRadius: 6, padding: "6px 10px", fontWeight: 500 }}
              />
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatTime(timer)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={handleFinishTask}
                style={{ flex: 1, padding: "8px 0", borderRadius: 6, background: "#3498db", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Finish Task
              </button>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e74c3c", marginBottom: 8, textAlign: "center" }}>
              ${moneySpent}
            </div>
            <div style={{ fontSize: 14, color: "#666", display: "flex", justifyContent: "center", gap: "16px" }}>
              <span>${perMinuteSpent}/min</span>
              <span>${perSecondSpent}/sec</span>
            </div>
          </div>
          {/* Cumulative Line Chart at the bottom */}
          <div style={{ maxWidth: 400, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px #0001", margin: "24px auto 0 auto" }}>
            <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: 16 }}>Cumulative Tasks Completed</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      {/* Page 2: Task History */}
      {page === 1 && (
        <div style={{ maxWidth: 400, background: "#fafbfc", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px #0001", margin: "0 auto" }}>
          <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: 16 }}>Task History</h4>
          {taskHistory.length === 0 && <div style={{ color: "#bbb", fontSize: 14 }}>No tasks finished yet.</div>}
          {taskHistory.map((task, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 8,
                padding: 12,
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 1px 2px #0001",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                position: "relative",
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 14 }}>{task.name || <em>Untitled</em>}</span>
              <span style={{ color: "#e74c3c", fontWeight: 700, fontVariantNumeric: "tabular-nums", marginLeft: 0, fontSize: 14 }}>
                ${task.amount}
              </span>
              <span style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                {new Date(task.timestamp).toISOString().replace('T', ' ').slice(0, 16)}
                {typeof task.duration === 'number' && (
                  <span style={{ marginLeft: 8, color: '#3498db' }}>
                    • {Math.floor(task.duration / 60)}m {(task.duration % 60).toString().padStart(2, '0')}s
                  </span>
                )}
              </span>
              <button
                onClick={() => {
                  const newHistory = [...taskHistory.slice(0, idx), ...taskHistory.slice(idx + 1)];
                  setTaskHistory(newHistory);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#e74c3c",
                  fontSize: 18,
                }}
                title="Delete Task"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 