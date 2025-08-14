"use client"

import { useState, useRef, useEffect, useMemo, memo } from "react"
import { FaMinus, FaPaperPlane, FaPlay, FaPause, FaPlus, FaRedo } from "react-icons/fa"
import { MdDelete } from "react-icons/md"
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

// Memoized chart component to prevent unnecessary re-renders
const MemoizedChart = memo(({ chartData, showMinerals }: { chartData: any[]; showMinerals: boolean }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      {showMinerals ? (
        <>
          <Line type="monotone" dataKey="rock" stroke="#e74c3c" strokeWidth={3} dot={{ r: 4 }} name="Rocks" isAnimationActive={false} />
          <Line type="monotone" dataKey="pebble" stroke="#f39c12" strokeWidth={3} dot={{ r: 4 }} name="Pebbles" isAnimationActive={false} />
          <Line type="monotone" dataKey="sand" stroke="#95a5a6" strokeWidth={3} dot={{ r: 4 }} name="Sand" isAnimationActive={false} />
        </>
      ) : (
        <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
      )}
    </LineChart>
  </ResponsiveContainer>
));

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
  const [currentTaskCategory, setCurrentTaskCategory] = useState<string>("rock");
  const [taskHistory, setTaskHistory] = useState<{ name: string; amount: string; timestamp: number; duration?: number; category: string }[]>([]);
  const [showMinerals, setShowMinerals] = useState<boolean>(true);
  const [taskHistoryMinimized, setTaskHistoryMinimized] = useState<boolean>(false);
  const [loginStreak, setLoginStreak] = useState<number>(0);
  const [lastLoginDate, setLastLoginDate] = useState<string>("");

  // Data migration function
  const migrateData = (data: any, currentVersion: string) => {
    const savedVersion = localStorage.getItem("burnEngine_dataVersion");
    
    // Create backup of existing data before migration
    if (!savedVersion && data) {
      localStorage.setItem("burnEngine_backup_" + Date.now(), JSON.stringify(data));
    }
    
    // If no version saved, this is the first time or old data
    if (!savedVersion) {
      // Migrate to version 1.1 (add category field)
      if (Array.isArray(data)) {
        return data.map((task: any) => ({
          ...task,
          category: task.category || "rock" // Default to rock for existing tasks
        }));
      }
    }
    
    // For future migrations, you can add more version checks here
    // Example:
    // if (savedVersion === "1.1" && currentVersion === "1.2") {
    //   // Migrate from 1.1 to 1.2
    // }
    
    return data;
  };

  // On mount, load state from localStorage (browser only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("burnEngine_hourlyRate");
      if (savedRate) setHourlyRate(Number(savedRate));
      const savedTimer = localStorage.getItem("burnEngine_timer");
      if (savedTimer) setTimer(Number(savedTimer));
      const savedTask = localStorage.getItem("burnEngine_currentTask");
      if (savedTask) setCurrentTask(savedTask);
      const savedCategory = localStorage.getItem("burnEngine_currentTaskCategory");
      if (savedCategory) setCurrentTaskCategory(savedCategory);
      const savedHistory = localStorage.getItem("burnEngine_taskHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Migrate existing data to include category field
        const migratedHistory = migrateData(parsedHistory, "1.1");
        setTaskHistory(migratedHistory);
      }
      
      const savedShowMinerals = localStorage.getItem("burnEngine_showMinerals");
      if (savedShowMinerals !== null) {
        setShowMinerals(JSON.parse(savedShowMinerals));
      }
      
      const savedTaskHistoryMinimized = localStorage.getItem("burnEngine_taskHistoryMinimized");
      if (savedTaskHistoryMinimized !== null) {
        setTaskHistoryMinimized(JSON.parse(savedTaskHistoryMinimized));
      }
      
      // Load login streak data
      const savedLoginStreak = localStorage.getItem("burnEngine_loginStreak");
      const savedLastLoginDate = localStorage.getItem("burnEngine_lastLoginDate");
      
      if (savedLoginStreak && savedLastLoginDate) {
        const currentDate = new Date().toDateString();
        const lastLogin = savedLastLoginDate;
        
        if (currentDate === lastLogin) {
          // Already logged in today, keep current streak
          setLoginStreak(Number(savedLoginStreak));
          setLastLoginDate(lastLogin);
        } else {
          // Check if it's consecutive days
          const lastLoginTime = new Date(lastLogin).getTime();
          const currentTime = new Date().getTime();
          const daysDiff = Math.floor((currentTime - lastLoginTime) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Consecutive day, increment streak
            const newStreak = Number(savedLoginStreak) + 1;
            setLoginStreak(newStreak);
            setLastLoginDate(currentDate);
            localStorage.setItem("burnEngine_loginStreak", newStreak.toString());
            localStorage.setItem("burnEngine_lastLoginDate", currentDate);
          } else if (daysDiff > 1) {
            // Streak broken, reset to 1
            setLoginStreak(1);
            setLastLoginDate(currentDate);
            localStorage.setItem("burnEngine_loginStreak", "1");
            localStorage.setItem("burnEngine_lastLoginDate", currentDate);
          } else {
            // Same day, keep current streak
            setLoginStreak(Number(savedLoginStreak));
            setLastLoginDate(lastLogin);
          }
        }
      } else {
        // First time logging in
        const currentDate = new Date().toDateString();
        setLoginStreak(1);
        setLastLoginDate(currentDate);
        localStorage.setItem("burnEngine_loginStreak", "1");
        localStorage.setItem("burnEngine_lastLoginDate", currentDate);
      }
      
      // Set current data version
      localStorage.setItem("burnEngine_dataVersion", "1.1");
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
      localStorage.setItem("burnEngine_currentTaskCategory", currentTaskCategory)
    }
  }, [currentTaskCategory])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_taskHistory", JSON.stringify(taskHistory))
    }
  }, [taskHistory])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_showMinerals", JSON.stringify(showMinerals))
    }
  }, [showMinerals])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("burnEngine_taskHistoryMinimized", JSON.stringify(taskHistoryMinimized))
    }
  }, [taskHistoryMinimized])

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
          category: currentTaskCategory,
        },
        ...taskHistory,
      ]);
    }
    setCurrentTask("");
    setTimer(0);
    startTimeRef.current = Date.now();
  };

  // Prepare data for cumulative line chart
  const chartData = useMemo(() => {
    // Generate historical dates (last 7 days) with 0 values
    const historicalDates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      historicalDates.push(date.toLocaleDateString());
    }

    if (showMinerals) {
      // Group by day and category for minerals view
      const dayCategoryCounts: Record<string, { rock: number; pebble: number; sand: number }> = {};
      
      // Initialize all historical dates with 0 values
      historicalDates.forEach(day => {
        dayCategoryCounts[day] = { rock: 0, pebble: 0, sand: 0 };
      });
      
      // Add actual task data
      taskHistory.forEach((task) => {
        const day = new Date(task.timestamp).toLocaleDateString();
        if (!dayCategoryCounts[day]) {
          dayCategoryCounts[day] = { rock: 0, pebble: 0, sand: 0 };
        }
        dayCategoryCounts[day][task.category as keyof typeof dayCategoryCounts[typeof day]]++;
      });
      
      // Build array for chart
      return Object.keys(dayCategoryCounts)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((day) => ({ 
          day, 
          rock: dayCategoryCounts[day].rock,
          pebble: dayCategoryCounts[day].pebble,
          sand: dayCategoryCounts[day].sand
        }));
    } else {
      // Group by day for regular view
      const dayCounts: Record<string, number> = {};
      
      // Initialize all historical dates with 0 values
      historicalDates.forEach(day => {
        dayCounts[day] = 0;
      });
      
      // Add actual task data
      taskHistory.forEach((task) => {
        const day = new Date(task.timestamp).toLocaleDateString();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      
      // Build array for chart
      return Object.keys(dayCounts)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map((day) => ({ day, count: dayCounts[day] }));
    }
  }, [showMinerals, taskHistory]);

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
          {loginStreak > 0 && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              marginBottom: 12,
              padding: "8px 12px",
              background: loginStreak >= 7 ? "#e8f5e8" : "#fff3cd",
              borderRadius: 6,
              border: `1px solid ${loginStreak >= 7 ? "#28a745" : "#ffc107"}`
            }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ 
                fontWeight: 600, 
                fontSize: 14,
                color: loginStreak >= 7 ? "#28a745" : "#856404"
              }}>
                {loginStreak} day{loginStreak !== 1 ? 's' : ''} streak
              </span>
              {loginStreak >= 7 && (
                <span style={{ 
                  fontSize: 12, 
                  color: "#28a745",
                  fontWeight: 500
                }}>
                  • Keep it up!
                </span>
              )}
            </div>
          )}
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Work on the one thing</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <select
              value={currentTaskCategory}
              onChange={(e) => setCurrentTaskCategory(e.target.value)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 4,
                padding: "6px 8px",
                fontWeight: 500,
                background: "#f5f5f5",
                fontSize: 14,
                minWidth: 80,
              }}
            >
              <option value="rock">Rock</option>
              <option value="pebble">Pebble</option>
              <option value="sand">Sand</option>
            </select>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
              {showMinerals ? "Show Minerals" : "Cumulative Tasks Completed"}
            </h4>
            <button
              onClick={() => setShowMinerals(!showMinerals)}
              style={{
                background: showMinerals ? "#3498db" : "#f1f1f1",
                color: showMinerals ? "#fff" : "#333",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {showMinerals ? "Show All" : "Show Minerals"}
            </button>
          </div>
          <MemoizedChart chartData={chartData} showMinerals={showMinerals} />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Task History</h4>
          <button
            onClick={() => setTaskHistoryMinimized((m) => !m)}
            style={{
              background: taskHistoryMinimized ? "#f1f1f1" : "#eee",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 1px 4px #0001",
              fontSize: 18,
              cursor: "pointer",
              color: "#888",
              padding: 6,
              transition: "background 0.2s",
            }}
            title={taskHistoryMinimized ? "Expand" : "Minimize"}
          >
            {taskHistoryMinimized ? <FaPlus /> : <FaMinus />}
          </button>
        </div>
        {!taskHistoryMinimized && (
          <>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{task.name || <em>Untitled</em>}</span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  background: task.category === "rock" ? "#e74c3c" : task.category === "pebble" ? "#f39c12" : "#95a5a6",
                  color: "#fff",
                }}
              >
                {task.category}
              </span>
            </div>
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
              <MdDelete />
            </button>
          </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
