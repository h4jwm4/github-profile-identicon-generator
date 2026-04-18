import { useState, useEffect, useRef } from "react";
import {
  RefreshCw, Download, Github, Zap, Shield, Shuffle,
  ChevronRight, Copy, Check, Star, GitFork, Terminal, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

// ─── Identicon engine ────────────────────────────────────────────────────────

function generateIdenticon(gridSize = 5, saturation = 65) {
  const hue = Math.floor(Math.random() * 360);
  const color = `hsl(${hue},${saturation}%,55%)`;
  const half = Math.ceil(gridSize / 2);
  const pixels = [];

  for (let row = 0; row < gridSize; row++) {
    const rowData = Array.from({ length: half }, () => Math.random() > 0.42);
    const full = [...rowData];
    for (let c = 0; c < gridSize - half; c++) {
      full.push(rowData[half - 2 - c] ?? rowData[0]);
    }
    pixels.push(...full);
  }
  return { color, pixels, gridSize };
}

function drawToCanvas(canvas, { color, pixels, gridSize }, bg = "#0d0d0d", rounded = false) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = 480;
  const pSize = size / gridSize;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = color;
  pixels.forEach((on, i) => {
    if (!on) return;
    const x = (i % gridSize) * pSize;
    const y = Math.floor(i / gridSize) * pSize;
    const r = rounded ? pSize * 0.28 : 0;
    if (rounded) {
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, pSize - 4, pSize - 4, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, pSize, pSize);
    }
  });
}

// ─── Copied state hook ───────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return [copied, copy];
}

// ─── Mini preview card ───────────────────────────────────────────────────────
function MiniPreview({ seed, bg, rounded }) {
  const ref = useRef(null);
  const [icon] = useState(() => {
    const h = Math.floor((seed * 137.5) % 360);
    const color = `hsl(${h},60%,55%)`;
    const pixels = [];
    const rng = (n) => ((Math.sin(n * 9301 + seed * 49297 + 233) * 360)) % 1;
    for (let r = 0; r < 5; r++) {
      const row = Array.from({ length: 3 }, (_, c) => rng(r * 3 + c) > 0.42);
      pixels.push(row[0], row[1], row[2], row[1], row[0]);
    }
    return { color, pixels, gridSize: 5 };
  });

  useEffect(() => {
    drawToCanvas(ref.current, icon, bg, rounded);
  }, [icon, bg, rounded]);

  return (
    <canvas
      ref={ref}
      className="rounded-lg w-14 h-14 border border-white/10"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef = useRef(null);
  const [icon, setIcon] = useState(null);
  const [gridSize, setGridSize] = useState(5);
  const [saturation, setSaturation] = useState(65);
  const [bgMode, setBgMode] = useState("dark");
  const [rounded, setRounded] = useState(false);
  const [history, setHistory] = useState([]);
  const [copiedHex, copyHex] = useCopy();
  const [generating, setGenerating] = useState(false);

  const bgColor = bgMode === "dark" ? "#0d0d0d" : bgMode === "light" ? "#f5f5f5" : "#1a1a2e";

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newIcon = generateIdenticon(gridSize, saturation);
      setIcon(newIcon);
      setHistory((h) => [newIcon, ...h].slice(0, 8));
      setGenerating(false);
    }, 60);
  };

  useEffect(() => { generate(); }, []);

  useEffect(() => {
    if (icon) drawToCanvas(canvasRef.current, icon, bgColor, rounded);
  }, [icon, bgColor, rounded]);

  const download = (scale = 1) => {
    const out = document.createElement("canvas");
    const s = 480 * scale;
    out.width = s;
    out.height = s;
    const ctx = out.getContext("2d");
    ctx.drawImage(canvasRef.current, 0, 0, s, s);
    const a = document.createElement("a");
    a.download = `identicon-${Date.now()}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  };

  // HSL → hex approximation for display
  const hslToHex = (hslStr) => {
    if (!hslStr) return "#000000";
    const m = hslStr.match(/hsl\((\d+),(\d+)%,(\d+)%\)/);
    if (!m) return hslStr;
    let [h, s, l] = [+m[1] / 360, +m[2] / 100, +m[3] / 100];
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  };

  const hexColor = icon ? hslToHex(icon.color) : "#888";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'DM Mono', 'Fira Code', monospace" }}>

        {/* ── Nav ── */}
        <nav className="border-b border-white/8 sticky top-0 z-50 bg-[#080808]/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 grid grid-cols-3 grid-rows-3 gap-0.5">
                {[1,0,1,0,1,0,1,0,1].map((on, i) => (
                  <div key={i} className={`rounded-[1px] ${on ? "bg-emerald-400" : "bg-white/10"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold tracking-widest uppercase text-white/90">Identicon</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-white/15 text-white/50 text-[10px] font-mono">v1.0</Badge>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm" className="text-white/50 hover:text-white gap-1.5 text-xs">
                  <Github size={14} /> GitHub
                </Button>
              </a>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-[10px] tracking-widest uppercase">
                  Open Source
                </Badge>
                <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px] tracking-widest uppercase">
                  Free Forever
                </Badge>
              </div>
              <h1 className="text-5xl font-bold leading-[1.1] mb-5 tracking-tight">
                GitHub Profile
                <br />
                <span className="text-emerald-400">Identicons.</span>
                <br />
                <span className="text-white/30">Instantly.</span>
              </h1>
              <p className="text-white/40 text-base leading-relaxed mb-8 max-w-md" style={{ fontFamily: "system-ui, sans-serif" }}>
                Generate symmetrical pixel avatars for your GitHub profile. No account needed, no tracking,
                no nonsense — just pure randomness rendered as art.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={generate}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-2 px-6"
                >
                  <Shuffle size={15} /> Generate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => download(2)}
                  className="border-white/15 text-white/70 hover:text-white hover:border-white/30 gap-2"
                >
                  <Download size={15} /> Download PNG
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 text-white/25 text-xs">
                <span className="flex items-center gap-1.5"><Star size={11} /> 100% client-side</span>
                <span className="flex items-center gap-1.5"><Shield size={11} /> Zero data collected</span>
                <span className="flex items-center gap-1.5"><GitFork size={11} /> MIT licensed</span>
              </div>
            </div>

            {/* Right — canvas + controls */}
            <div className="flex flex-col items-center gap-6">
              {/* Canvas */}
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30" style={{ background: icon?.color }} />
                <canvas
                  ref={canvasRef}
                  className={`relative w-64 h-64 rounded-2xl border border-white/10 ${generating ? "opacity-30 scale-95" : "opacity-100 scale-100"} transition-all duration-150`}
                  style={{ imageRendering: "pixelated" }}
                />
                {/* Color chip */}
                {icon && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => copyHex(hexColor)}
                        className="absolute -bottom-3 -right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-[#0d0d0d] text-[10px] font-mono text-white/60 hover:text-white transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: icon.color }} />
                        {hexColor}
                        {copiedHex ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copy hex color</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Config panel */}
              <Card className="w-full bg-white/[0.03] border-white/8 text-white">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-xs font-mono tracking-widest uppercase text-white/40 flex items-center gap-2">
                    <Terminal size={11} /> Config
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-5">
                  {/* Grid size */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-white/50 font-mono">Grid Size</Label>
                      <span className="text-xs font-mono text-emerald-400">{gridSize}×{gridSize}</span>
                    </div>
                    <Tabs value={String(gridSize)} onValueChange={(v) => setGridSize(+v)}>
                      <TabsList className="bg-white/5 border border-white/8 w-full">
                        {[5, 7, 9].map((n) => (
                          <TabsTrigger key={n} value={String(n)} className="flex-1 text-xs font-mono data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
                            {n}×{n}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Saturation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-white/50 font-mono">Saturation</Label>
                      <span className="text-xs font-mono text-emerald-400">{saturation}%</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      onValueChange={([v]) => setSaturation(v)}
                      min={20} max={100} step={5}
                      className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-emerald-400 [&_[role=slider]]:border-0"
                    />
                  </div>

                  {/* Background */}
                  <div className="space-y-2">
                    <Label className="text-xs text-white/50 font-mono">Background</Label>
                    <Tabs value={bgMode} onValueChange={setBgMode}>
                      <TabsList className="bg-white/5 border border-white/8 w-full">
                        {["dark", "light", "deep"].map((m) => (
                          <TabsTrigger key={m} value={m} className="flex-1 text-xs font-mono capitalize data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
                            {m}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Rounded toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50 font-mono">Rounded pixels</Label>
                    <Switch
                      checked={rounded}
                      onCheckedChange={setRounded}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <Separator className="bg-white/8" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={generate}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs gap-1.5 w-full"
                    >
                      <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
                      Regenerate
                    </Button>
                    <div className="flex gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => download(1)} variant="outline" className="flex-1 border-white/10 text-white/50 hover:text-white text-xs">1×</Button>
                        </TooltipTrigger>
                        <TooltipContent>480×480 px</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => download(2)} variant="outline" className="flex-1 border-white/10 text-white/50 hover:text-white text-xs">2×</Button>
                        </TooltipTrigger>
                        <TooltipContent>960×960 px</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => download(4)} variant="outline" className="flex-1 border-white/10 text-white/50 hover:text-white text-xs">4×</Button>
                        </TooltipTrigger>
                        <TooltipContent>1920×1920 px</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── History ── */}
        {history.length > 1 && (
          <section className="border-t border-white/8 py-12">
            <div className="max-w-6xl mx-auto px-6">
              <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-5">Session History</p>
              <div className="flex gap-3 flex-wrap">
                {history.map((h, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIcon(h)}
                        className={`rounded-xl overflow-hidden border transition-all duration-150 ${i === 0 ? "border-emerald-400/40 scale-105" : "border-white/8 hover:border-white/20 opacity-60 hover:opacity-100"}`}
                      >
                        <MiniPreview seed={i * 7 + h.pixels.filter(Boolean).length} bg={bgColor} rounded={rounded} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{i === 0 ? "Current" : `Previous #${i}`}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Features ── */}
        <section className="border-t border-white/8 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12">
              <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Why use this</p>
              <h2 className="text-3xl font-bold tracking-tight">Built for devs.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Zap size={16} className="text-emerald-400" />,
                  title: "Instant generation",
                  desc: "Zero server round-trips. The entire algorithm runs in your browser using a seeded RNG with guaranteed symmetry.",
                },
                {
                  icon: <Shield size={16} className="text-emerald-400" />,
                  title: "Fully private",
                  desc: "No analytics, no cookies, no backend. What happens in your browser stays in your browser.",
                },
                {
                  icon: <Layers size={16} className="text-emerald-400" />,
                  title: "Export at any size",
                  desc: "Download at 1×, 2×, or 4× resolution. GitHub recommends at least 460×460 — we go up to 1920px.",
                },
              ].map((f, i) => (
                <Card key={i} className="bg-white/[0.025] border-white/8 text-white hover:border-white/15 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center mb-3">
                      {f.icon}
                    </div>
                    <CardTitle className="text-sm font-semibold">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-white/35 text-sm leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>
                      {f.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-white/8 py-20 bg-white/[0.015]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12">
              <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">The algorithm</p>
              <h2 className="text-3xl font-bold tracking-tight">How it works.</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-px bg-white/8 rounded-xl overflow-hidden">
              {[
                { step: "01", title: "Random hue", desc: "Pick a random hue 0–360° and build a vivid HSL color." },
                { step: "02", title: "Half-grid fill", desc: "Fill only the left half of the grid using a random boolean per cell." },
                { step: "03", title: "Mirror", desc: "Mirror each row horizontally to guarantee perfect bilateral symmetry." },
                { step: "04", title: "Render", desc: "Paint to an HTML5 Canvas at 480px, then scale on download." },
              ].map((s) => (
                <div key={s.step} className="bg-[#080808] p-6">
                  <p className="text-4xl font-bold text-white/5 mb-4">{s.step}</p>
                  <p className="text-sm font-semibold mb-2 text-white/80">{s.title}</p>
                  <p className="text-xs text-white/30 leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-white/8 py-24">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-[10px] font-mono text-white/25 tracking-widest uppercase mb-4">Ready?</p>
            <h2 className="text-4xl font-bold mb-6 tracking-tight">
              Get your identicon<br />
              <span className="text-emerald-400">in 3 seconds.</span>
            </h2>
            <Button
              onClick={generate}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-2 px-8 py-6 text-base"
            >
              <Shuffle size={18} /> Generate Now <ChevronRight size={16} />
            </Button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/8 py-8">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-white/25 text-xs font-mono">
            <span>identicon · MIT · {new Date().getFullYear()}</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Github size={12} /> View source
            </a>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}