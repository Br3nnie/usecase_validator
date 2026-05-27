import { useState } from "react";

const DIMENSIONS = {
  problemClarity: {
    label: "Problem Clarity",
    question: "Can you describe the problem you're solving without mentioning any technology?",
    hint: "Rate how clearly the core problem is defined, independent of any solution.",
    isGate: true,
    gateThreshold: 3,
    gateFailMessage: "If you can't define the problem without referencing the technology, everything built on top of it is assumption, not insight. Go back to the problem before evaluating any solution.",
  },
  stakeholderValidation: {
    label: "Stakeholder Validation",
    question: "Have the people who actually experience this problem confirmed it's a real, recurring priority?",
    hint: "Not your assumption — their words. Have they been asked?",
    isGate: true,
    gateThreshold: 3,
    gateFailMessage: "Without validation from the people who live with this problem, you're solving for an executive hypothesis. That's how shelfware gets bought. Talk to the end users first.",
  },
  processMaturity: {
    label: "Process Maturity",
    question: "Is the underlying process documented, consistent, and reasonably understood today?",
    hint: "If the process is chaotic or undocumented, AI will accelerate the chaos.",
    weight: 0.4,
  },
  dataReadiness: {
    label: "Data Readiness",
    question: "Does the right data exist, is it accessible, and is it clean enough to act on?",
    hint: "AI is only as good as the data feeding it. Garbage in, garbage out.",
    weight: 0.35,
  },
  roiRealism: {
    label: "ROI Realism",
    question: "Can you articulate what success looks like in measurable, specific terms?",
    hint: "Not 'efficiency gains' — actual numbers, timelines, and owners.",
    weight: 0.25,
  },
};

const LABELS = ["Not at all", "Unlikely", "Partially", "Mostly", "Clearly yes"];

const BLOCKERS = {
  processMaturity: [
    "The process is too undefined to automate — you'll accelerate the wrong thing.",
    "Some process documentation exists but gaps will surface under AI load.",
    "Process is reasonably consistent but would benefit from mapping before automating.",
    "Good process maturity. Minor inconsistencies worth resolving before full deployment.",
    "Strong process foundation. Ready for automation overlay.",
  ],
  dataReadiness: [
    "Critical data gaps — AI cannot function reliably without addressing these first.",
    "Data exists but accessibility or quality issues will undermine outputs.",
    "Data is usable but needs cleansing or governance work before scaling.",
    "Data is largely ready. Spot-check quality before deployment.",
    "Strong data readiness. Proceed with confidence on data foundations.",
  ],
  roiRealism: [
    "No measurable definition of success — risk of a solution looking for a problem.",
    "Success is loosely defined. Sharpen the metrics before committing resources.",
    "Reasonable ROI framing but could be more specific on timelines and ownership.",
    "Good ROI definition. Confirm measurement mechanisms are in place.",
    "Clear, measurable ROI definition. Strong basis for investment decision.",
  ],
};

const VERDICT_BANDS = [
  { min: 80, label: "Strong Foundation", color: "#22c55e", icon: "✅", message: "Your use case has solid foundations. The logical next step is a process blueprint before selecting any technology." },
  { min: 60, label: "Proceed with Conditions", color: "#f59e0b", icon: "⚠️", message: "There's a viable use case here, but specific gaps need groundwork before committing to a technology decision." },
  { min: 40, label: "Significant Groundwork Needed", color: "#f97316", icon: "🔶", message: "This isn't a no — but it isn't ready. Acting now risks investing in the wrong solution to a poorly defined problem." },
  { min: 0, label: "Not Ready", color: "#ef4444", icon: "🛑", message: "The foundations aren't in place yet. Proceeding without addressing these gaps typically leads to expensive reversals." },
];

function RadarChart({ scores }) {
  const dims = ["processMaturity", "dataReadiness", "roiRealism"];
  const labels = ["Process\nMaturity", "Data\nReadiness", "ROI\nRealism"];
  const cx = 160, cy = 160, r = 110;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  function polarToCartesian(angle, radius) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const angles = dims.map((_, i) => (i / dims.length) * 360);
  const gridPolygons = levels.map(level => {
    const pts = angles.map(a => polarToCartesian(a, r * level));
    return pts.map(p => `${p.x},${p.y}`).join(" ");
  });

  const scorePts = dims.map((d, i) => {
    const val = (scores[d] || 0) / 5;
    return polarToCartesian(angles[i], r * val);
  });
  const scorePolygon = scorePts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 320 320" style={{ width: "100%", maxWidth: 280 }}>
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#334155" strokeWidth="1" />
      ))}
      {angles.map((angle, i) => {
        const pt = polarToCartesian(angle, r);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#334155" strokeWidth="1" />;
      })}
      <polygon points={scorePolygon} fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth="2" />
      {scorePts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="#6366f1" />
      ))}
      {angles.map((angle, i) => {
        const pt = polarToCartesian(angle, r + 26);
        const lines = labels[i].split("\n");
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="'DM Sans', sans-serif">
            {lines.map((line, j) => (
              <tspan key={j} x={pt.x} dy={j === 0 ? (lines.length > 1 ? "-0.5em" : "0") : "1.2em"}>{line}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreBar({ value, max = 5, color = "#6366f1" }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ background: "#1e293b", borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

export default function App() {
  const [useCase, setUseCase] = useState("");
  const [step, setStep] = useState("intro");
  const [scores, setScores] = useState({ problemClarity: 3, stakeholderValidation: 3, processMaturity: 3, dataReadiness: 3, roiRealism: 3 });
  const [gateIndex, setGateIndex] = useState(0);
  const [scoringIndex, setScoringIndex] = useState(0);
  const [failedGate, setFailedGate] = useState(null);
  const [dependencyRisk, setDependencyRisk] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const gates = ["problemClarity", "stakeholderValidation"];
  const scoringDims = ["processMaturity", "dataReadiness", "roiRealism"];

  function calcScore() {
    const weighted =
      (scores.processMaturity / 5) * 0.4 +
      (scores.dataReadiness / 5) * 0.35 +
      (scores.roiRealism / 5) * 0.25;
    return Math.round(weighted * 100);
  }

  function getVerdict(score) {
    return VERDICT_BANDS.find(b => score >= b.min);
  }

  async function fetchInsights(depRisk) {
    setLoadingInsights(true);
    try {
      const prompt = `You are an AI strategy advisor helping a mid-size business executive evaluate an AI use case.

Use case: "${useCase}"

Scores (1-5):
- Process Maturity: ${scores.processMaturity}/5
- Data Readiness: ${scores.dataReadiness}/5
- ROI Realism: ${scores.roiRealism}/5
- AI Dependency Risk: ${depRisk === "yes" ? "YES - process would fail if AI became unavailable" : "NO - process has fallback"}

Foundation Score: ${calcScore()}/100

Respond ONLY with a JSON object, no markdown, no preamble:
{
  "topRisk": "One sentence naming the single biggest risk with this use case given the scores",
  "firstAction": "One concrete action the executive should take before proceeding — specific, not generic",
  "timeframe": "Realistic timeframe to address the main gap (e.g. '4-6 weeks', '2-3 months')"
}`;

      const response = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      setAiInsights(JSON.parse(clean));
    } catch (e) {
      setAiInsights({
        topRisk: "Unable to generate insight at this time.",
        firstAction: "Review your dimension scores manually and address the lowest-scoring area first.",
        timeframe: "Varies by gap severity",
      });
    }
    setLoadingInsights(false);
  }

  function handleGateNext() {
    const dim = gates[gateIndex];
    if (scores[dim] < DIMENSIONS[dim].gateThreshold) {
      setFailedGate(dim);
      setStep("gateBlock");
      return;
    }
    if (gateIndex < gates.length - 1) {
      setGateIndex(gateIndex + 1);
    } else {
      setStep("scoring");
    }
  }

  function handleScoringNext() {
    if (scoringIndex < scoringDims.length - 1) {
      setScoringIndex(scoringIndex + 1);
    } else {
      setStep("dependency");
    }
  }

  function handleDependency(answer) {
    setDependencyRisk(answer);
    setStep("results");
    fetchInsights(answer);
  }

  function reset() {
    setUseCase("");
    setStep("intro");
    setScores({ problemClarity: 3, stakeholderValidation: 3, processMaturity: 3, dataReadiness: 3, roiRealism: 3 });
    setGateIndex(0);
    setScoringIndex(0);
    setFailedGate(null);
    setDependencyRisk(null);
    setAiInsights(null);
  }

  const score = calcScore();
  const verdict = getVerdict(score);

  const s = {
    wrap: { minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" },
    card: { background: "#1e293b", borderRadius: 16, padding: "40px 36px", maxWidth: 580, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" },
    label: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", fontWeight: 700, marginBottom: 8 },
    h1: { fontSize: 26, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.25, marginBottom: 8 },
    body: { fontSize: 15, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24 },
    input: { width: "100%", background: "#0f172a", border: "1.5px solid #334155", borderRadius: 10, padding: "14px 16px", color: "#e2e8f0", fontSize: 15, fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 80, boxSizing: "border-box" },
    btn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 16, fontFamily: "'DM Sans', sans-serif" },
    btnSecondary: { background: "transparent", color: "#6366f1", border: "1.5px solid #6366f1", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 10, fontFamily: "'DM Sans', sans-serif" },
    sliderWrap: { marginTop: 20, marginBottom: 8 },
    sliderVal: { fontSize: 32, fontWeight: 700, color: "#6366f1", textAlign: "center", marginBottom: 4 },
    sliderLabel: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16 },
    hint: { fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 12, padding: "10px 14px", background: "#0f172a", borderRadius: 8, borderLeft: "3px solid #334155" },
    progress: { display: "flex", gap: 6, marginBottom: 28 },
    progressDot: (active, done) => ({ height: 4, flex: 1, borderRadius: 4, background: done ? "#6366f1" : active ? "#818cf8" : "#0f172a", border: done || active ? "none" : "1px solid #334155" }),
    blockBanner: { background: "#1e0a0a", border: "1.5px solid #ef4444", borderRadius: 12, padding: "20px", marginBottom: 20 },
    riskBanner: { background: "#1a0f00", border: "1.5px solid #f97316", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" },
    scoreCircle: { width: 100, height: 100, borderRadius: "50%", background: `conic-gradient(${verdict?.color} ${score * 3.6}deg, #0f172a 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    scoreInner: { width: 78, height: 78, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" },
    insightCard: { background: "#0f172a", borderRadius: 10, padding: "16px 18px", marginBottom: 12 },
  };

  return (
    <div style={s.wrap}>
      {step === "intro" && (
        <div style={s.card}>
          <div style={s.label}>ClearFoundation</div>
          <h1 style={s.h1}>AI Use Case Validator</h1>
          <p style={s.body}>Before buying a licence or briefing a team, find out whether your AI use case has the foundations to succeed — or whether you're solving the wrong problem with expensive technology.</p>
          <p style={{ ...s.body, marginBottom: 0, fontSize: 14 }}>Takes under 4 minutes. No fluff. Just a clear verdict.</p>
          <textarea style={{ ...s.input, marginTop: 24 }} placeholder="Describe the AI use case you're considering in one or two sentences..." value={useCase} onChange={e => setUseCase(e.target.value)} />
          <button style={{ ...s.btn, opacity: useCase.trim().length < 10 ? 0.5 : 1 }} disabled={useCase.trim().length < 10} onClick={() => setStep("gates")}>
            Begin Assessment →
          </button>
        </div>
      )}

      {step === "gates" && (
        <div style={s.card}>
          <div style={s.progress}>
            {gates.map((_, i) => <div key={i} style={s.progressDot(i === gateIndex, i < gateIndex)} />)}
          </div>
          <div style={s.label}>Foundation Gate {gateIndex + 1} of {gates.length}</div>
          <h1 style={{ ...s.h1, fontSize: 20 }}>{DIMENSIONS[gates[gateIndex]].question}</h1>
          <div style={s.hint}>{DIMENSIONS[gates[gateIndex]].hint}</div>
          <div style={s.sliderWrap}>
            <div style={s.sliderVal}>{scores[gates[gateIndex]]}<span style={{ fontSize: 16, color: "#475569" }}>/5</span></div>
            <div style={s.sliderLabel}>{LABELS[scores[gates[gateIndex]] - 1]}</div>
            <input type="range" min="1" max="5" value={scores[gates[gateIndex]]} onChange={e => setScores({ ...scores, [gates[gateIndex]]: Number(e.target.value) })} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginTop: 4 }}>
              <span>1 — No</span><span>5 — Yes</span>
            </div>
          </div>
          <button style={s.btn} onClick={handleGateNext}>Continue →</button>
        </div>
      )}

      {step === "gateBlock" && failedGate && (
        <div style={s.card}>
          <div style={s.label}>Gate Check Failed</div>
          <h1 style={{ ...s.h1, fontSize: 20, color: "#ef4444" }}>Stop. Redefine.</h1>
          <div style={s.blockBanner}>
            <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 600, marginBottom: 6 }}>🚫 {DIMENSIONS[failedGate].label}</div>
            <p style={{ fontSize: 14, color: "#fca5a5", lineHeight: 1.6, margin: 0 }}>{DIMENSIONS[failedGate].gateFailMessage}</p>
          </div>
          <p style={{ ...s.body, fontSize: 14 }}>No score is generated. The foundations aren't in place to evaluate this use case objectively. Addressing this gate is the only productive next step.</p>
          <button style={s.btn} onClick={reset}>Start Again</button>
        </div>
      )}

      {step === "scoring" && (
        <div style={s.card}>
          <div style={s.progress}>
            {scoringDims.map((_, i) => <div key={i} style={s.progressDot(i === scoringIndex, i < scoringIndex)} />)}
          </div>
          <div style={s.label}>{DIMENSIONS[scoringDims[scoringIndex]].label}</div>
          <h1 style={{ ...s.h1, fontSize: 20 }}>{DIMENSIONS[scoringDims[scoringIndex]].question}</h1>
          <div style={s.hint}>{DIMENSIONS[scoringDims[scoringIndex]].hint}</div>
          <div style={s.sliderWrap}>
            <div style={s.sliderVal}>{scores[scoringDims[scoringIndex]]}<span style={{ fontSize: 16, color: "#475569" }}>/5</span></div>
            <div style={s.sliderLabel}>{LABELS[scores[scoringDims[scoringIndex]] - 1]}</div>
            <input type="range" min="1" max="5" value={scores[scoringDims[scoringIndex]]} onChange={e => setScores({ ...scores, [scoringDims[scoringIndex]]: Number(e.target.value) })} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginTop: 4 }}>
              <span>1 — No</span><span>5 — Yes</span>
            </div>
          </div>
          <button style={s.btn} onClick={handleScoringNext}>
            {scoringIndex < scoringDims.length - 1 ? "Next →" : "Final Check →"}
          </button>
        </div>
      )}

      {step === "dependency" && (
        <div style={s.card}>
          <div style={s.label}>Dependency Risk Check</div>
          <h1 style={{ ...s.h1, fontSize: 20 }}>If this AI tool became unavailable or 3× more expensive tomorrow — would this process still function?</h1>
          <p style={s.body}>This isn't about likelihood. It's about whether you've built contingency into your decision.</p>
          <button style={{ ...s.btn, marginTop: 8 }} onClick={() => handleDependency("yes")}>No — the process would break or become unaffordable</button>
          <button style={s.btnSecondary} onClick={() => handleDependency("no")}>Yes — we have fallback options or human alternatives</button>
        </div>
      )}

      {step === "results" && (
        <div style={s.card}>
          <div style={s.label}>Your Results</div>

          {dependencyRisk === "yes" && (
            <div style={s.riskBanner}>
              <span style={{ fontSize: 20 }}>🔴</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", marginBottom: 4 }}>AI Dependency Risk Detected</div>
                <div style={{ fontSize: 13, color: "#fed7aa", lineHeight: 1.5 }}>You've identified a critical single point of failure. This use case needs scenario planning before it becomes embedded in a business-critical process.</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 28 }}>
            <div style={s.scoreCircle}>
              <div style={s.scoreInner}>
                <div style={{ fontSize: 26, fontWeight: 700, color: verdict?.color, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>/ 100</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: verdict?.color, marginBottom: 4 }}>{verdict?.icon} {verdict?.label}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{verdict?.message}</div>
            </div>
          </div>

          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <RadarChart scores={scores} />
          </div>

          <div style={{ marginBottom: 24 }}>
            {scoringDims.map(dim => (
              <div key={dim} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>{DIMENSIONS[dim].label}</span>
                  <span style={{ color: "#6366f1", fontWeight: 700 }}>{scores[dim]}/5</span>
                </div>
                <ScoreBar value={scores[dim]} />
                <div style={{ fontSize: 12, color: "#475569", marginTop: 5 }}>{BLOCKERS[dim][scores[dim] - 1]}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #334155", paddingTop: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>AI-Generated Insight</div>
            {loadingInsights ? (
              <div style={{ fontSize: 14, color: "#475569", textAlign: "center", padding: "20px 0" }}>Analysing your use case...</div>
            ) : aiInsights ? (
              <>
                <div style={s.insightCard}>
                  <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Top Risk</div>
                  <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>{aiInsights.topRisk}</div>
                </div>
                <div style={s.insightCard}>
                  <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>First Action</div>
                  <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>{aiInsights.firstAction}</div>
                </div>
                <div style={s.insightCard}>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Realistic Timeframe</div>
                  <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>{aiInsights.timeframe}</div>
                </div>
              </>
            ) : null}
          </div>

          <div style={{ background: "#0f172a", borderRadius: 10, padding: "18px 20px", marginBottom: 20, borderLeft: "3px solid #6366f1" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>Want to work through this with a thinking partner?</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>ClearFoundation helps mid-size executives make confident AI decisions — without the hype, the wasted licences, or the expensive reversals.</div>
          </div>

          <button style={s.btnSecondary} onClick={reset}>Validate Another Use Case</button>
        </div>
      )}
    </div>
  );
}
