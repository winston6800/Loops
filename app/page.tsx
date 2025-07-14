"use client"

import { useState, useRef, useEffect } from "react"
import { FaMinus, FaPaperPlane, FaPlay, FaPause, FaPlus, FaRedo } from "react-icons/fa"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

interface OpenLoop {
  id: number
  name: string
  time: number
}

interface Loop {
  id: number
  title: string
  isChecked: boolean
  time: number
  isActive: boolean
  rate: number // $/hr
}

function OpenLoopsDashboard({ mainTaskActive, pauseMainTask }: { mainTaskActive: boolean; pauseMainTask: () => void }) {
  const [loops, setLoops] = useState<Loop[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("burnEngine_openLoopsDashboard")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [input, setInput] = useState("")
  const [minimized, setMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("burnEngine_openLoopsMinimized")
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [activeId, setActiveId] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Save loops to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_openLoopsDashboard", JSON.stringify(loops))
    }
  }, [loops])

  // Save minimized state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_openLoopsMinimized", JSON.stringify(minimized))
    }
  }, [minimized])

  // Timer effect for active loop
  useEffect(() => {
    if (activeId == null) return
    const interval = setInterval(() => {
      setLoops((ls) => ls.map((l) => (l.id === activeId ? { ...l, time: l.time + 1 } : l)))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeId])

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [input])

  const handleAdd = () => {
    if (input.trim()) {
      setLoops([
        {
          id: Date.now(),
          title: input,
          isChecked: false,
          time: 0,
          isActive: false,
          rate: 1000, // $/hr default
        },
        ...loops,
      ])
      setInput("")
    }
  }

  const handlePlayPause = (id: number) => {
    if (activeId === id) {
      setLoops((ls) => ls.map((l) => (l.id === id ? { ...l, isActive: false } : l)))
      setActiveId(null)
    } else {
      pauseMainTask() // Pause main task if running
      setLoops((ls) => ls.map((l) => (l.id === id ? { ...l, isActive: true } : { ...l, isActive: false })))
      setActiveId(id)
    }
  }

  const handleCheck = (id: number) => {
    setLoops((ls) => ls.filter((l) => l.id !== id))
  }

  const calcCost = (loop: Loop) => ((loop.time / 3600) * loop.rate).toFixed(2)

  return (
    <div
      style={{
        maxWidth: 400,
        background: "#faf9f7",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        padding: 20,
        margin: "2rem auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#222" }}>Open Loops</span>
        <button
          onClick={() => setMinimized((m) => !m)}
          style={{
            background: minimized ? "#f1f1f1" : "#eee",
            border: "none",
            borderRadius: 8,
            boxShadow: "0 1px 4px #0001",
            fontSize: 18,
            cursor: "pointer",
            color: "#888",
            padding: 6,
            transition: "background 0.2s",
          }}
          title={minimized ? "Expand" : "Minimize"}
        >
          {minimized ? <FaPlus /> : <FaMinus />}
        </button>
      </div>
      {!minimized && (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16 }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a distraction or open loop"
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 15,
                minHeight: 36,
                maxHeight: 80,
                overflow: "auto",
                background: "#fff",
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: "#eee",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginTop: 2,
              }}
              title="Add"
            >
              <FaPaperPlane size={14} />
            </button>
          </div>
          <div>
            {loops.map((loop) => (
              <div
                key={loop.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  borderRadius: 8,
                  marginBottom: 10,
                  padding: "8px 10px",
                  boxShadow: "0 1px 2px #0001",
                }}
              >
                <input
                  type="checkbox"
                  checked={loop.isChecked}
                  onChange={() => handleCheck(loop.id)}
                  style={{ marginRight: 6, cursor: "pointer" }}
                />
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: "#222", whiteSpace: "pre-line" }}>
                  {loop.title}
                </span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 70 }}>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 14 }}>
                    {formatTime(loop.time)}
                  </span>
                  <span style={{ color: "#e74c3c", fontWeight: 700, fontSize: 13 }}>${calcCost(loop)} spent</span>
                </div>
                <button
                  onClick={() => handlePlayPause(loop.id)}
                  style={{
                    background: loop.isActive ? "#e0e7ff" : "#222",
                    color: loop.isActive ? "#222" : "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 8,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: loop.isActive ? "0 0 8px #a5b4fc" : undefined,
                  }}
                  title={loop.isActive ? "Pause" : "Play"}
                  disabled={mainTaskActive && !loop.isActive}
                >
                  {loop.isActive ? <FaPause /> : <FaPlay />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function BurnEngine() {
  // Hydration-safe state initialization
  const [hourlyRate, setHourlyRate] = useState<number>(90);
  const [timer, setTimer] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [taskHistory, setTaskHistory] = useState<{ name: string; amount: string; timestamp: number; duration?: number }[]>([]);

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
      localStorage.setItem("burnEngine_isRunning", JSON.stringify(false)) // isRunning is removed
    }
  }, [])
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

  // Main work timer
  // useEffect(() => {
  //   let interval: ReturnType<typeof setInterval> | null = null
  //   if (isRunning) {
  //     // Store the start time when timer starts
  //     startTimeRef.current = Date.now() - timer * 1000
  //     interval = setInterval(() => {
  //       if (startTimeRef.current) {
  //         const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
  //         setTimer(elapsedSeconds)
  //       }
  //     }, 1000)
  //   } else {
  //     startTimeRef.current = null
  //   }
  //   return () => {
  //     if (interval) clearInterval(interval)
  //   }
  // }, [isRunning])

  const moneySpent = ((timer / 3600) * hourlyRate).toFixed(2)
  const perMinuteSpent = (hourlyRate / 60).toFixed(2)
  const perSecondSpent = (hourlyRate / 3600).toFixed(2)

  // Add a function to pause the main task
  const pauseMainTask = () => {
    // setIsRunning(false) // isRunning is removed
  }

  const handleReset = () => {
    setTimer(0)
    // setIsRunning(false) // isRunning is removed
    startTimeRef.current = null
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_timer", "0")
      localStorage.setItem("burnEngine_isRunning", "false")
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
    let cumulative = 0;
    const sorted = [...taskHistory].sort((a, b) => a.timestamp - b.timestamp);
    sorted.forEach((task) => {
      const day = new Date(task.timestamp).toLocaleDateString();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    // Build cumulative array
    const result: { day: string; count: number }[] = [];
    Object.keys(dayCounts)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .forEach((day) => {
        cumulative += dayCounts[day];
        result.push({ day, count: cumulative });
      });
    return result;
  })();

  // Optionally, render nothing until timer is loaded
  if (!hasLoaded) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: "2rem 1rem" }}>
      {/* Flex row for main timer and cumulative chart */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
          maxWidth: 950,
          margin: "0 auto 2rem auto",
        }}
      >
        {/* Main timer and controls */}
        <div
          style={{
            flex: 1,
            maxWidth: 400,
            fontFamily: "Inter, sans-serif",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px #0001",
            padding: 24,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Your hourly value</span>
            <input
              type="number"
              value={hourlyRate}
              min={1}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              style={{
                width: 70,
                border: "1px solid #ddd",
                borderRadius: 4,
                padding: "2px 6px",
                fontWeight: 600,
                marginLeft: 8,
              }}
            />
            <span style={{ marginLeft: 4, fontWeight: 500, color: "#888" }}>$ / hr</span>
            <span
              style={{
                marginLeft: "auto",
                color: Number(moneySpent) > 0 ? "#e74c3c" : "#333",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                fontSize: 16,
              }}
            >
              -${moneySpent}
            </span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Work on the one thing</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <input
              type="text"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "#f5f5f5",
                borderRadius: 6,
                padding: "6px 10px",
                fontWeight: 500,
              }}
            />
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatTime(timer)}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={handleFinishTask}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 6,
                background: "#3498db",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Finish Task
            </button>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#e74c3c",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            ${moneySpent}
          </div>
          <div style={{ fontSize: 14, color: "#666", display: "flex", justifyContent: "center", gap: "16px" }}>
            <span>${perMinuteSpent}/min</span>
            <span>${perSecondSpent}/sec</span>
          </div>
        </div>
        {/* Cumulative Line Chart */}
        <div style={{ flex: 1, maxWidth: 500, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px #0001" }}>
          <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: 16 }}>Cumulative Tasks Completed</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Open Loops and Task History below */}
      <OpenLoopsDashboard mainTaskActive={true} pauseMainTask={() => {}} />
      <div
        style={{
          maxWidth: 400,
          background: "#fafbfc",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 4px #0001",
          margin: "2rem auto 0 auto",
        }}
      >
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
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 14 }}>{task.name || <em>Untitled</em>}</span>
            <span style={{ color: "#e74c3c", fontWeight: 700, fontVariantNumeric: "tabular-nums", marginLeft: 0, fontSize: 14 }}>
              ${task.amount}
            </span>
            <span style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              {new Date(task.timestamp).toLocaleString()}
              {typeof task.duration === 'number' && (
                <span style={{ marginLeft: 8, color: '#3498db' }}>
                  • {Math.floor(task.duration / 60)}m {(task.duration % 60).toString().padStart(2, '0')}s
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
