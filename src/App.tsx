import { useState, useEffect, useRef } from "react";
import {
  RefreshCw, Download, Shield, Shuffle, Copy, Check, Star, GitFork, Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

// Interfaces for Type Safety.
interface IdenticonData {
  color: string;
  pixels: boolean[];
  gridSize: number;
}

interface GitHubProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const GitHub = ({ size = 20, ...props }: GitHubProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

function generateIdenticon(gridSize: number = 5, saturation: number = 65): IdenticonData {
  const hue = Math.floor(Math.random() * 360);
  const color = `hsl(${hue},${saturation}%,45%)`;
  const half = Math.ceil(gridSize / 2);
  const pixels: boolean[] = [];

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

function drawToCanvas(
  canvas: HTMLCanvasElement | null, 
  { color, pixels, gridSize }: IdenticonData, 
  bg: string = "#ffffff", 
  rounded: boolean = false
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = canvas.width || 480;
  const pSize = size / gridSize;
  
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

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return [copied, copy];
}

function MiniPreview({ seed, bg, rounded }: { seed: number, bg: string, rounded: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [icon] = useState<IdenticonData>(() => {
    const h = Math.floor((seed * 137.5) % 360);
    const color = `hsl(${h},60%,45%)`;
    const pixels: boolean[] = [];
    const rng = (n: number) => ((Math.sin(n * 9301 + seed * 49297 + 233) * 360)) % 1;
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
    <canvas ref={ref} width={64} height={64} className="rounded-lg w-14 h-14 border border-black/5" style={{ imageRendering: "pixelated" }} />
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState(5);
  const [saturation, setSaturation] = useState(65);
  const [bgMode, setBgMode] = useState("light");
  const [rounded, setRounded] = useState(false);
  const [history, setHistory] = useState<IdenticonData[]>([]);
  const [copiedHex, copyHex] = useCopy();
  const [generating, setGenerating] = useState(false);

  const [icon, setIcon] = useState<IdenticonData>(() => 
    generateIdenticon(5, 65) // Use default values here
  );

  const bgColor = bgMode === "light" ? "#ffffff" : bgMode === "dark" ? "#1a1a1a" : "#f0f2f5";
  const GITHUB_URL = "https://github.com/h4jwm4/github-profile-identicon-generator";

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newIcon = generateIdenticon(gridSize, saturation);
      setIcon(newIcon);
      setHistory((h) => [newIcon, ...h].slice(0, 8));
      setGenerating(false);
    }, 60);
  };

  useEffect(() => {
    drawToCanvas(canvasRef.current, icon, bgColor, rounded);
  }, [icon, bgColor, rounded]);
  const download = (scale: number = 1) => {
    if (!icon) return;
    const out = document.createElement("canvas");
    const s = 480 * scale;
    out.width = s;
    out.height = s;
    drawToCanvas(out, icon, bgColor, rounded);
    const a = document.createElement("a");
    a.download = `identicon-h4jwm4-${Date.now()}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  };

  const hslToHex = (hslStr: string) => {
    if (!hslStr) return "#000000";
    const m = hslStr.match(/hsl\((\d+),(\d+)%,(\d+)%\)/);
    if (!m) return hslStr;
    const h = +m[1] / 360;
    const s = +m[2] / 100;
    const l = +m[3] / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  };

  const hexColor = icon ? hslToHex(icon.color) : "#444";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'DM Mono', 'Fira Code', monospace" }}>
        <nav className="border-b border-slate-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 grid grid-cols-3 grid-rows-3 gap-0.5">
                {[1,0,1,0,1,0,1,0,1].map((on, i) => (
                  <div key={i} className={`rounded-[1px] ${on ? "bg-emerald-600" : "bg-slate-200"}`} />
                ))}
              </div>
              <span className="text-sm font-bold tracking-widest uppercase text-slate-800">Identicon</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-slate-200 text-slate-400 text-[10px] font-mono">PROD v1.0</Badge>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-1.5 text-xs">
                  <GitHub size={14} /> h4jwm4
                </Button>
              </a>
            </div>
          </div>
        </nav>

        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] tracking-widest uppercase">
                  Open Source
                </Badge>
              </div>
              <h1 className="text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight text-slate-900">
                GitHub Profile <br /> <span className="text-emerald-600">Identicons.</span>
              </h1>
              <div className="flex items-center gap-3 mt-8">
                <Button onClick={generate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                  <Shuffle size={15} /> Generate
                </Button>
                <Button variant="outline" onClick={() => download(2)} className="border-slate-200">
                  <Download size={15} /> Download PNG
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Star size={11} /> 100% client-side</span>
                <span className="flex items-center gap-1.5"><Shield size={11} /> No data collected</span>
                <span className="flex items-center gap-1.5"><GitFork size={11} /> MIT licensed</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-3xl opacity-20 scale-110" style={{ background: icon?.color }} />
                <canvas ref={canvasRef} width={480} height={480} className={`relative w-64 h-64 rounded-2xl border border-slate-200 shadow-xl ${generating ? "opacity-30 scale-95" : "opacity-100 scale-100"} transition-all duration-150`} style={{ imageRendering: "pixelated" }} />
                {icon && (
                  <button onClick={() => copyHex(hexColor)} className="absolute -bottom-3 -right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[10px] font-mono text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: icon.color }} />
                    {hexColor}
                    {copiedHex ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                  </button>
                )}
              </div>

              <Card className="w-full bg-slate-50/50 border-slate-200 shadow-none">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-xs font-mono tracking-widest uppercase text-slate-400 flex items-center gap-2">
                    <Terminal size={11} /> Config
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-500 font-mono">Grid Size</Label>
                      <span className="text-xs font-mono text-emerald-600 font-bold">{gridSize}×{gridSize}</span>
                    </div>
                    <Tabs value={String(gridSize)} onValueChange={(v) => setGridSize(+v)}>
                      <TabsList className="bg-slate-100 border-none w-full p-1">
                        {[5, 7, 9].map((n) => (
                          <TabsTrigger key={n} value={String(n)} className="flex-1 text-xs font-mono">
                            {n}×{n}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-500 font-mono">Saturation</Label>
                      <span className="text-xs font-mono text-emerald-600 font-bold">{saturation}%</span>
                    </div>
                    <Slider value={[saturation]} onValueChange={([v]) => setSaturation(v)} min={20} max={100} step={5} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 font-mono">Background</Label>
                    <Tabs value={bgMode} onValueChange={setBgMode}>
                      <TabsList className="bg-slate-100 border-none w-full p-1">
                        {["light", "dark", "deep"].map((m) => (
                          <TabsTrigger key={m} value={m} className="flex-1 text-xs font-mono capitalize">
                            {m}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-500 font-mono">Rounded pixels</Label>
                    <Switch checked={rounded} onCheckedChange={setRounded} />
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={generate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 w-full shadow-sm">
                      <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
                      Regenerate
                    </Button>
                    <div className="flex gap-1.5">
                      {[1, 2, 4].map((s) => (
                        <Button key={s} onClick={() => download(s)} variant="outline" className="flex-1 border-slate-200 text-xs bg-white">{s}×</Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {history.length > 1 && (
          <section className="border-t border-slate-100 py-12 bg-slate-50/30">
            <div className="max-w-6xl mx-auto px-6">
              <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mb-5">Session History</p>
              <div className="flex gap-3 flex-wrap">
                {history.map((h, i) => (
                  <button key={i} onClick={() => setIcon(h)} className={`rounded-xl overflow-hidden border transition-all duration-150 ${i === 0 ? "border-emerald-500 shadow-md scale-105" : "border-slate-200 opacity-60 hover:opacity-100"}`}>
                    <MiniPreview seed={i * 7 + h.pixels.filter(Boolean).length} bg={bgColor} rounded={rounded} />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-slate-100 py-8 bg-white">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>identicon-h4jwm4 · MIT · {new Date().getFullYear()}</span>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-slate-900 flex items-center gap-1.5 transition-colors">
              <GitHub size={12} /> View source
            </a>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}