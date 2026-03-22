import { useState, useEffect, useCallback, useRef } from "react";

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(board) {
  for (const [a,b,c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  if (board.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function getEmptyCells(board) {
  return board.map((v,i) => v ? null : i).filter(i => i !== null);
}

function minimax(board, isMaximizing, aiSymbol, humanSymbol) {
  const res = checkWinner(board);
  if (res) {
    if (res.winner === aiSymbol) return 10;
    if (res.winner === humanSymbol) return -10;
    return 0;
  }
  const empty = getEmptyCells(board);
  if (isMaximizing) {
    let best = -Infinity;
    for (const i of empty) {
      board[i] = aiSymbol;
      best = Math.max(best, minimax(board, false, aiSymbol, humanSymbol));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      board[i] = humanSymbol;
      best = Math.min(best, minimax(board, true, aiSymbol, humanSymbol));
      board[i] = null;
    }
    return best;
  }
}

function getAIMove(board, difficulty, aiSymbol) {
  const humanSymbol = aiSymbol === "X" ? "O" : "X";
  const empty = getEmptyCells(board);

  if (difficulty === "easy") {
    if (Math.random() < 0.15) {
      for (const i of empty) {
        const b = [...board]; b[i] = aiSymbol;
        if (checkWinner(b)?.winner === aiSymbol) return i;
      }
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "medium") {
    for (const i of empty) {
      const b = [...board]; b[i] = aiSymbol;
      if (checkWinner(b)?.winner === aiSymbol) return i;
    }
    for (const i of empty) {
      const b = [...board]; b[i] = humanSymbol;
      if (checkWinner(b)?.winner === humanSymbol) return i;
    }
    if (board[4] === null) return 4;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard: Minimax
  let bestVal = -Infinity;
  let bestMove = empty[0];
  const boardCopy = [...board];
  for (const i of empty) {
    boardCopy[i] = aiSymbol;
    const val = minimax(boardCopy, false, aiSymbol, humanSymbol);
    boardCopy[i] = null;
    if (val > bestVal) { bestVal = val; bestMove = i; }
  }
  return bestMove;
}

function Cell({ value, index, onClick, winLine, disabled, aiThinking }) {
  const isWin = winLine.includes(index);
  return (
    <button
      onClick={onClick}
      disabled={disabled || !!value || aiThinking}
      style={{
        width: 100, height: 100,
        background: isWin ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
        border: isWin ? "2px solid rgba(251,191,36,0.6)" : "2px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        cursor: (value || disabled || aiThinking) ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, fontWeight: 800,
        color: value === "X" ? "#f87171" : "#60a5fa",
        transition: "all 0.2s ease",
        transform: isWin ? "scale(1.06)" : "scale(1)",
        backdropFilter: "blur(6px)",
        boxShadow: isWin ? "0 0 24px rgba(251,191,36,0.3)" : value ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
        animation: value ? "pop 0.22s cubic-bezier(0.36,0.07,0.19,0.97)" : "none",
      }}
    >
      {value === "X" ? "✕" : value === "O" ? "○" : ""}
    </button>
  );
}

const DIFFICULTIES = [
  { key: "easy",   label: "😊 Facile",    color: "#4ade80", desc: "L'IA joue presque au hasard" },
  { key: "medium", label: "🧠 Moyen",     color: "#fbbf24", desc: "L'IA bloque et attaque" },
  { key: "hard",   label: "💀 Difficile", color: "#f87171", desc: "Algorithme Minimax — imbattable" },
];

// Détermine qui commence selon les probabilités
// PvP : 1/2 chaque joueur | Vs IA : 2/3 joueur, 1/3 IA
function rollWhoStarts(mode) {
  if (mode === "pvp") {
    return Math.random() < 0.5 ? "X" : "O"; // 50/50
  } else {
    return Math.random() < 2/3 ? "X" : "O"; // 66.7% joueur (X), 33.3% IA (O)
  }
}

export default function Morpion() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [celebrating, setCelebrating] = useState(false);
  const [mode, setMode] = useState("pvp");
  const [difficulty, setDifficulty] = useState("medium");
  const [aiThinking, setAiThinking] = useState(false);
  const [coinFlip, setCoinFlip] = useState(null); // null | "flipping" | "X" | "O"
  const [coinMsg, setCoinMsg] = useState("");

  const startWithCoinFlip = useCallback((currentMode) => {
    setCoinFlip("flipping");
    setCoinMsg("");
    setTimeout(() => {
      const starter = rollWhoStarts(currentMode);
      setCoinFlip(starter);
      if (currentMode === "pvp") {
        setCoinMsg(starter === "X" ? "✕ commence !" : "○ commence !");
      } else {
        setCoinMsg(starter === "X" ? "🎲 Tu commences !" : "🤖 L'IA commence !");
      }
      setIsX(starter === "X");
      setTimeout(() => setCoinFlip(null), 1800);
    }, 1000);
  }, []);

  const applyResult = useCallback((b) => {
    const res = checkWinner(b);
    if (res) {
      setResult(res);
      setCelebrating(true);
      setScores(s => ({ ...s, [res.winner]: (s[res.winner] || 0) + 1 }));
      setTimeout(() => setCelebrating(false), 800);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (mode !== "ai" || result || isX || aiThinking || coinFlip) return;
    setAiThinking(true);
    const delay = difficulty === "hard" ? 550 : 380;
    const timer = setTimeout(() => {
      setBoard(prev => {
        const move = getAIMove(prev, difficulty, "O");
        if (move === undefined) { setAiThinking(false); return prev; }
        const next = [...prev];
        next[move] = "O";
        const ended = applyResult(next);
        if (!ended) setIsX(true);
        setAiThinking(false);
        return next;
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [isX, mode, difficulty, result, aiThinking, applyResult, coinFlip]);

  const handleClick = (i) => {
    if (board[i] || result || aiThinking || coinFlip) return;
    if (mode === "ai" && !isX) return;
    const next = [...board];
    next[i] = isX ? "X" : "O";
    setBoard(next);
    const ended = applyResult(next);
    if (!ended) setIsX(mode === "ai" ? false : !isX);
  };

  const reset = (currentMode) => {
    const m = currentMode || mode;
    setBoard(Array(9).fill(null));
    setResult(null);
    setAiThinking(false);
    setIsX(true);
    startWithCoinFlip(m);
  };

  const resetAll = () => {
    setBoard(Array(9).fill(null));
    setResult(null);
    setAiThinking(false);
    setIsX(true);
    setScores({ X: 0, O: 0, draw: 0 });
    startWithCoinFlip(mode);
  };

  // Lancer le tirage au démarrage
  useEffect(() => { startWithCoinFlip("pvp"); }, []);

  const isAiTurn = mode === "ai" && !isX && !result;

  const statusText = coinFlip ? ""
    : result
      ? result.winner === "draw" ? "⚡ Égalité !"
        : mode === "ai"
          ? result.winner === "X" ? "🎉 Tu gagnes !" : "🤖 L'IA gagne !"
          : `${result.winner === "X" ? "✕" : "○"} gagne !`
      : aiThinking ? "🤖 L'IA réfléchit..."
      : mode === "ai" ? (isX ? "Ton tour (✕)" : "Tour de l'IA (○)")
      : `Tour de ${isX ? "✕" : "○"}`;

  const diffInfo = DIFFICULTIES.find(d => d.key === difficulty);

  const statusColor = result
    ? result.winner === "draw" ? "#fbbf24"
      : result.winner === "X" ? "#f87171" : "#60a5fa"
    : aiThinking ? "#a78bfa"
    : isX ? "#f87171" : "#60a5fa";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif", padding: 24, position: "relative", overflow: "hidden",
    }}>
      <div style=/>
      <div style=/>

      <style>{`
        @keyframes pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes celebrate { 0%,100%{transform:translateY(0)} 25%{transform:translateY(-8px)} 75%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes coinSpin { 0%{transform:rotateY(0deg) scale(1)} 50%{transform:rotateY(180deg) scale(1.2)} 100%{transform:rotateY(360deg) scale(1)} }
        @keyframes coinLand { 0%{transform:scale(1.4)} 60%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        button:not(:disabled):hover { opacity: 0.85; }
      `}</style>

      <h1 style=>
        Morpion
      </h1>

      {/* Coin flip overlay */}
      {coinFlip && (
        <div style={{
          position:"fixed", inset:0, zIndex:100,
          background:"rgba(10,8,30,0.85)", backdropFilter:"blur(8px)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:20,
        }}>
          <div style={{
            fontSize: 72,
            animation: coinFlip === "flipping" ? "coinSpin 0.9s ease-in-out infinite" : "coinLand 0.3s ease-out",
          }}>
            🪙
          </div>
          {coinFlip === "flipping" ? (
            <div style=>
              Tirage au sort...
            </div>
          ) : (
            <div style={{
              color: coinFlip === "X" ? "#f87171" : "#60a5fa",
              fontSize:22, fontWeight:700, letterSpacing:3,
              animation:"fadeIn 0.4s ease",
            }}>
              {coinMsg}
            </div>
          )}
          {coinFlip !== "flipping" && (
            <div style=>
              {mode === "pvp" ? "Probabilité : 1/2 chaque joueur" : "Probabilité : 2/3 toi · 1/3 IA"}
            </div>
          )}
        </div>
      )}

      {/* Mode toggle */}
      <div style=>
        {[{key:"pvp",label:"👥 2 Joueurs"},{key:"ai",label:"🤖 Vs IA"}].map(m => (
          <button key={m.key} onClick={() => { setMode(m.key); reset(m.key); }} style={{
            padding:"8px 20px", borderRadius:50,
            border:"none",
            background: mode === m.key ? "rgba(255,255,255,0.15)" : "transparent",
            color: mode === m.key ? "white" : "rgba(255,255,255,0.4)",
            fontSize:13, letterSpacing:1, cursor:"pointer", fontFamily:"inherit",
            transition:"all 0.2s", fontWeight: mode === m.key ? 600 : 400,
          }}>{m.label}</button>
        ))}
      </div>

      {/* Difficulty */}
      {mode === "ai" && (
        <>
          <div style=>
            {DIFFICULTIES.map(d => (
              <button key={d.key} onClick={() => { setDifficulty(d.key); reset(mode); }} style={{
                padding:"6px 14px", borderRadius:50,
                border: difficulty === d.key ? `2px solid ${d.color}` : "2px solid rgba(255,255,255,0.08)",
                background: difficulty === d.key ? `${d.color}20` : "transparent",
                color: difficulty === d.key ? d.color : "rgba(255,255,255,0.3)",
                fontSize:11, letterSpacing:1, cursor:"pointer", fontFamily:"inherit",
                transition:"all 0.2s", fontWeight: difficulty === d.key ? 700 : 400,
              }}>{d.label}</button>
            ))}
          </div>
          <div style=>
            {diffInfo.desc}
          </div>
        </>
      )}

      {/* Scores */}
      <div style=>
        {[
          {label: mode==="ai" ? "Toi" : "✕", sub: mode==="ai" ? "✕" : null, key:"X", color:"#f87171"},
          {label:"NUL", key:"draw", color:"#fbbf24"},
          {label: mode==="ai" ? "IA" : "○", sub: mode==="ai" ? "○" : null, key:"O", color:"#60a5fa"},
        ].map(({label,sub,key,color}) => (
          <div key={key} style=>
            <div style=>{label}{sub ? ` ${sub}` : ""}</div>
            <div style=>{scores[key]||0}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{
        color: statusColor, fontSize:17, fontWeight:700, marginBottom:18,
        letterSpacing:2, minHeight:30, transition:"color 0.3s",
        animation: celebrating ? "celebrate 0.5s ease" : aiThinking ? "pulse 0.9s infinite" : "none",
      }}>
        {statusText}
      </div>

      {/* Board */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3, 100px)", gap:10,
        padding:16, background:"rgba(255,255,255,0.03)", borderRadius:28,
        border:"1px solid rgba(255,255,255,0.07)",
        boxShadow:"0 20px 60px rgba(0,0,0,0.5)", backdropFilter:"blur(10px)",
        transition:"opacity 0.25s", opacity: aiThinking ? 0.75 : 1,
      }}>
        {board.map((val, i) => (
          <Cell key={i} value={val} index={i} onClick={() => handleClick(i)}
            winLine={result?.line || []} disabled={!!result} aiThinking={aiThinking} />
        ))}
      </div>

      {/* Buttons */}
      <div style=>
        <button onClick={() => reset()} style={{
          padding:"10px 26px", borderRadius:50,
          border:"2px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.06)",
          color:"white", fontSize:12, letterSpacing:2, cursor:"pointer",
          fontFamily:"inherit", textTransform:"uppercase", transition:"all 0.2s",
        }}>Rejouer</button>
        <button onClick={resetAll} style={{
          padding:"10px 26px", borderRadius:50,
          border:"2px solid rgba(255,255,255,0.07)", background:"transparent",
          color:"rgba(255,255,255,0.3)", fontSize:12, letterSpacing:2, cursor:"pointer",
          fontFamily:"inherit", textTransform:"uppercase", transition:"all 0.2s",
        }}>Reset scores</button>
      </div>
    </div>
  );
}
