import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Layers, Map as MapIcon, Maximize2, Mountain, Navigation, X } from 'lucide-react';
import { AYDIN_ROAD_SEGMENTS, RAIL_TRACK_Z } from '../data/aydinRoads';
import { LANDMARKS } from '../data/efelerData';
import { getRealElevationMeters, getSurfaceHeightAt, getTabakhaneCenterX } from '../game/terrain';
import { ErrandDef, LandmarkDef } from '../types/game';

const MAP_MIN_X = -228;
const MAP_MAX_X = 200;
const MAP_MIN_Z = -160;
const MAP_MAX_Z = 128;
const MAP_SPAN_X = MAP_MAX_X - MAP_MIN_X; // 428m in 1:100 model (~4.28 km E-W)
const MAP_SPAN_Z = MAP_MAX_Z - MAP_MIN_Z; // 288m in 1:100 model (~2.88 km N-S)

const MAP_NEIGHBORHOOD_LABELS: Array<{ name: string; x: number; z: number; sub?: string }> = [
  { name: 'AYDIN DAĞLARI', x: -16, z: -148, sub: '220m+' },
  { name: 'Kalfaköy · Tralleis', x: -58, z: -116, sub: '155m' },
  { name: 'Aytepe · ADÜ', x: 92, z: -116, sub: '172m' },
  { name: 'Zafer Mah.', x: -72, z: -82 },
  { name: 'Kemer Mah.', x: -158, z: -84 },
  { name: 'Orta Mahalle', x: 94, z: -48, sub: '92m' },
  { name: 'Köprülü-Veysipaşa', x: 18, z: -52 },
  { name: 'Hasanefendi', x: -38, z: -50 },
  { name: 'Yağcılar İçi', x: -76, z: -48 },
  { name: 'Meşrutiyet', x: 94, z: -8 },
  { name: 'Güzelhisar (Merkez)', x: 0, z: 10, sub: '64m' },
  { name: 'Sevgi Yolu', x: -40, z: 16 },
  { name: 'Cumhuriyet Mah.', x: -126, z: 22 },
  { name: 'Yedi Eylül Mah.', x: 138, z: 26 },
  { name: 'Kurtuluş · Gar', x: 0, z: 82, sub: '58m' },
  { name: 'Ilıcabaşı Mah.', x: 0, z: 112 },
  { name: 'Magnesia', x: -188, z: -20 },
];

function worldToNorm(x: number, z: number): [number, number] {
  return [(x - MAP_MIN_X) / MAP_SPAN_X, (z - MAP_MIN_Z) / MAP_SPAN_Z];
}

let cachedTopoCanvas: HTMLCanvasElement | null = null;

function getOrBuildTopoBitmap(): HTMLCanvasElement {
  if (cachedTopoCanvas) return cachedTopoCanvas;

  const w = 440;
  const h = Math.round((w * MAP_SPAN_Z) / MAP_SPAN_X); // 296px
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const elevGrid = new Float32Array(w * h);

  // 1. Sample 1:100 topographic relief & hypsometric tints
  for (let py = 0; py < h; py++) {
    const wz = MAP_MIN_Z + (py / (h - 1)) * MAP_SPAN_Z;
    for (let px = 0; px < w; px++) {
      const wx = MAP_MIN_X + (px / (w - 1)) * MAP_SPAN_X;
      const y = getSurfaceHeightAt(wx, wz);
      const idx = py * w + px;
      elevGrid[idx] = y;

      let r = 216;
      let g = 225;
      let b = 186;
      if (y < 0.7) {
        // Büyük Menderes Ovası (~58–65m)
        const t = Math.max(0, Math.min(1, y / 0.7));
        r = 212 + t * 14;
        g = 223 + t * 4;
        b = 182 - t * 6;
      } else if (y < 3.0) {
        // Tarihi Çarşı & Alt Yamaçlar (~65–88m)
        const t = (y - 0.7) / 2.3;
        r = 226 + t * 10;
        g = 227 - t * 16;
        b = 176 - t * 24;
      } else if (y < 8.5) {
        // Yokuşlar & Orta Mahalle (~88–143m)
        const t = (y - 3.0) / 5.5;
        r = 236 - t * 14;
        g = 211 - t * 30;
        b = 152 - t * 28;
      } else if (y < 14.0) {
        // Tralleis & Aytepe Tepeleri (~143–198m)
        const t = (y - 8.5) / 5.5;
        r = 222 - t * 24;
        g = 181 - t * 34;
        b = 124 - t * 26;
      } else {
        // Aydın Dağları Etekleri & Sırtları (200m+)
        const t = Math.min(1, (y - 14.0) / 14.0);
        r = 198 - t * 34;
        g = 147 - t * 26;
        b = 98 - t * 16;
      }

      const off = idx * 4;
      img.data[off] = r;
      img.data[off + 1] = g;
      img.data[off + 2] = b;
      img.data[off + 3] = 255;
    }
  }

  // 2. Crisp contour isolines (every ~2.2 game meters = ~22m elevation interval)
  const contourStep = 2.2;
  for (let py = 1; py < h - 1; py++) {
    for (let px = 1; px < w - 1; px++) {
      const idx = py * w + px;
      const b0 = Math.floor(elevGrid[idx] / contourStep);
      const bR = Math.floor(elevGrid[idx + 1] / contourStep);
      const bD = Math.floor(elevGrid[idx + w] / contourStep);
      if (b0 !== bR || b0 !== bD) {
        const off = idx * 4;
        img.data[off] = Math.max(0, img.data[off] - 32);
        img.data[off + 1] = Math.max(0, img.data[off + 1] - 34);
        img.data[off + 2] = Math.max(0, img.data[off + 2] - 28);
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // 3. Tabakhane Deresi blue ribbon
  ctx.strokeStyle = '#4B89B5';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let wz = MAP_MIN_Z; wz <= MAP_MAX_Z; wz += 2) {
    const [nx, nz] = worldToNorm(getTabakhaneCenterX(wz), wz);
    if (wz === MAP_MIN_Z) ctx.moveTo(nx * w, nz * h);
    else ctx.lineTo(nx * w, nz * h);
  }
  ctx.stroke();

  // 4. Polyline Aydın Road Network
  ctx.strokeStyle = 'rgba(72, 54, 38, 0.62)';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  AYDIN_ROAD_SEGMENTS.forEach((road) => {
    if (road.points.length < 2) return;
    ctx.beginPath();
    road.points.forEach(([px, pz], idx) => {
      const [nx, nz] = worldToNorm(px, pz);
      if (idx === 0) ctx.moveTo(nx * w, nz * h);
      else ctx.lineTo(nx * w, nz * h);
    });
    ctx.stroke();
  });

  // 5. 1882 İzmir-Aydın Railway track
  const [rx0, rz0] = worldToNorm(-140, RAIL_TRACK_Z);
  const [rx1, rz1] = worldToNorm(140, RAIL_TRACK_Z);
  ctx.save();
  ctx.strokeStyle = '#3B2C22';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(rx0 * w, rz0 * h);
  ctx.lineTo(rx1 * w, rz1 * h);
  ctx.stroke();
  ctx.restore();

  cachedTopoCanvas = canvas;
  return canvas;
}

interface AydinTopographicMinimapProps {
  playerPos: [number, number];
  headingRad: number;
  elevationMeters: number;
  currentDistrict: string;
  discoveredIds: string[];
  activeErrand: ErrandDef | null;
  errandPickedUp: boolean;
  isCompactViewport: boolean;
  onJumpToLandmark: (landmark: LandmarkDef) => void;
}

export const AydinTopographicMinimap = memo(function AydinTopographicMinimap({
  playerPos,
  headingRad,
  elevationMeters,
  currentDistrict,
  discoveredIds,
  activeErrand,
  errandPickedUp,
  isCompactViewport,
  onJumpToLandmark,
}: AydinTopographicMinimapProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<LandmarkDef | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const topoDataUrl = useMemo(() => {
    if (typeof document === 'undefined') return '';
    return getOrBuildTopoBitmap().toDataURL();
  }, []);

  const landmarkElevations = useMemo(() => {
    const out: Record<string, number> = {};
    LANDMARKS.forEach((lm) => {
      out[lm.id] = getRealElevationMeters(lm.position[0], lm.position[2]);
    });
    return out;
  }, []);

  const errandTargetId = activeErrand
    ? errandPickedUp
      ? activeErrand.toLandmarkId
      : activeErrand.fromLandmarkId
    : null;

  // Draw lightweight mini-radar directly onto corner canvas when visible
  useEffect(() => {
    if (isCompactViewport || expanded) return;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const topo = getOrBuildTopoBitmap();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(topo, 0, 0, w, h);

    // Draw landmark dots
    for (const lm of LANDMARKS) {
      const [nx, nz] = worldToNorm(lm.position[0], lm.position[2]);
      const px = nx * w;
      const py = nz * h;
      const isErrand = errandTargetId === lm.id;
      const isDisc = discoveredIds.includes(lm.id);

      ctx.beginPath();
      ctx.arc(px, py, isErrand ? 4.2 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = isErrand ? '#4CA86B' : isDisc ? '#FAF2E2' : '#D98E32';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#3A2618';
      ctx.stroke();
    }

    // Draw player directional arrow
    const [pnx, pnz] = worldToNorm(playerPos[0], playerPos[1]);
    const px = Math.max(6, Math.min(w - 6, pnx * w));
    const py = Math.max(6, Math.min(h - 6, pnz * h));
    ctx.save();
    ctx.translate(px, py);
    // Game heading: 0 = North (-Z = up on map), positive heading turns CCW (+heading = left/-X)
    ctx.rotate(-headingRad);
    ctx.fillStyle = '#C85A32';
    ctx.strokeStyle = '#FFF9EE';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.lineTo(4.6, 5);
    ctx.lineTo(0, 2.4);
    ctx.lineTo(-4.6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [playerPos, headingRad, discoveredIds, errandTargetId, isCompactViewport, expanded]);

  const [playerNormX, playerNormZ] = worldToNorm(playerPos[0], playerPos[1]);

  return (
    <>
      {/* Corner Minimap Trigger */}
      {!expanded && (
        <div className="pointer-events-auto flex flex-col items-end">
          {isCompactViewport ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="1:100 Ölçekli Aydın Topografik Haritası"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7EEDC]/94 hover:bg-[#EFE0C3] border-2 border-[#B99464] px-2.5 py-1.5 text-[11px] font-bold text-[#3A2618] shadow-md cursor-pointer"
            >
              <MapIcon className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
              <span className="font-mono-num">1:100</span>
              <span className="text-[#6B5038] font-mono-num">· {elevationMeters}m</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="1:100 Aydın Topografik & Mahalle Haritasını Büyüt"
              className="group relative overflow-hidden rounded-2xl bg-[#F7EEDC]/95 border-2 border-[#B99464] p-1.5 text-left shadow-lg hover:border-[#C85A32] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 px-1 pb-1 text-[10px] font-bold text-[#3A2618]">
                <span className="inline-flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-[#C85A32]" aria-hidden="true" />
                  <span>1:100 Aydın</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num text-[#6B5038]">
                  <span>{elevationMeters} m</span>
                  <Maximize2 className="w-2.5 h-2.5 text-[#B84C27] group-hover:scale-110 transition-transform" />
                </span>
              </div>
              <canvas
                ref={miniCanvasRef}
                width={168}
                height={113}
                className="block w-[164px] h-[110px] rounded-xl border border-[#B99464]/60"
              />
            </button>
          )}
        </div>
      )}

      {/* Expanded 1:100 Aydın Efeler Topographic & Neighborhood Map */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto flex items-center justify-center bg-[#23170E]/75 p-2.5 sm:p-5"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-3xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#B99464]/45 bg-[#EFE2C6]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#C85A32] text-[#FAF2E2] shrink-0">
                  <Layers className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-bold text-sm sm:text-base text-[#3A2618] truncate">
                      1:100 Ölçekli Aydın Efeler Topografik & Mahalle Haritası
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF2E2] border border-[#B99464]/60 font-mono-num text-[10px] font-bold text-[#B84C27]">
                      ÖLÇEK 1:100 · {currentDistrict} · {elevationMeters} m Rakım
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5038] truncate">
                    Aydın Dağları, Tralleis & Aytepe yokuşları, Tabakhane Deresi, Büyük Menderes Ovası ve 16 Efeler mahallesi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Haritayı Kapat"
                className="w-8 h-8 rounded-xl bg-[#FAF2E2] hover:bg-[#E5D4B3] border border-[#B99464]/60 flex items-center justify-center text-[#3A2618] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Map Body */}
            <div className="flex-1 overflow-y-auto efeler-scroll p-3 sm:p-4 space-y-3">
              <div className="relative w-full aspect-[440/296] rounded-2xl overflow-hidden border-2 border-[#B99464] shadow-inner bg-[#DCE5C0]">
                {topoDataUrl && (
                  <img
                    src={topoDataUrl}
                    alt="1:100 Ölçekli Aydın Topografik Haritası"
                    className="w-full h-full object-fill select-none"
                    draggable={false}
                  />
                )}

                {/* Compass Rose */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-xl bg-[#FAF2E2]/90 border border-[#B99464] px-2 py-1 text-[10px] font-bold text-[#3A2618] shadow">
                  <Compass className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
                  <span>K (Kuzey · Dağlar)</span>
                </div>

                {/* Neighborhood Labels Overlay */}
                {MAP_NEIGHBORHOOD_LABELS.map((lbl) => {
                  const [nx, nz] = worldToNorm(lbl.x, lbl.z);
                  return (
                    <div
                      key={lbl.name}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
                      style={{ left: `${nx * 100}%`, top: `${nz * 100}%` }}
                    >
                      <div className="px-1.5 py-0.5 rounded bg-[#FAF2E2]/80 border border-[#B99464]/50 text-[8px] sm:text-[10px] font-bold text-[#3A2618] whitespace-nowrap shadow-xs">
                        {lbl.name}
                        {lbl.sub && (
                          <span className="ml-1 font-mono-num text-[#B84C27]">{lbl.sub}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Landmark Clickable Pins */}
                {LANDMARKS.map((lm) => {
                  const [nx, nz] = worldToNorm(lm.position[0], lm.position[2]);
                  const isErrand = errandTargetId === lm.id;
                  const isDisc = discoveredIds.includes(lm.id);
                  const isSel = selectedPin?.id === lm.id;
                  return (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={() => setSelectedPin(lm)}
                      title={`${lm.name} (${landmarkElevations[lm.id]} m)`}
                      style={{ left: `${nx * 100}%`, top: `${nz * 100}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center shadow ${
                        isSel
                          ? 'scale-125 bg-[#C85A32] border-[#FFF9EE] z-20'
                          : isErrand
                            ? 'scale-110 bg-[#5D8A48] border-[#FFF9EE] z-10'
                            : isDisc
                              ? 'bg-[#FAF2E2] border-[#3A2618]'
                              : 'bg-[#E3A84F] border-[#3A2618]'
                      }`}
                    >
                      <span className="sr-only">{lm.name}</span>
                    </button>
                  );
                })}

                {/* Live Player Marker */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                  style={{
                    left: `${Math.max(2, Math.min(98, playerNormX * 100))}%`,
                    top: `${Math.max(2, Math.min(98, playerNormZ * 100))}%`,
                    transform: `translate(-50%, -50%) rotate(${(-headingRad * 180) / Math.PI}deg)`,
                  }}
                >
                  <Navigation
                    className="w-5 h-5 text-[#C85A32] fill-[#C85A32] drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Selected Landmark Fast-Travel Card OR Elevation Legend */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl bg-[#EFE2C6] border border-[#B99464]/60 px-3.5 py-2.5">
                {selectedPin ? (
                  <>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#3A2618]">
                        <span>{selectedPin.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#FAF2E2] border border-[#B99464]/50 font-mono-num text-[10px] text-[#B84C27]">
                          {landmarkElevations[selectedPin.id]} m Rakım
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B5038]">
                        {selectedPin.district} · {selectedPin.era}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToLandmark(selectedPin);
                        setExpanded(false);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] text-xs font-bold text-[#FAF2E2] shrink-0 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Bu Noktaya Git</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#5B432F]">
                    <span className="font-bold text-[#3A2618]">Yükselti Kademeleri (1:100):</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#D4DFB6] border border-[#3A2618]/30" />
                      <span>58–65m Menderes Ovası</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#EAD8AA] border border-[#3A2618]/30" />
                      <span>65–95m Çarşı & Orta Mah.</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#CFAC7C] border border-[#3A2618]/30" />
                      <span>150–175m Tralleis & Aytepe</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#B08762] border border-[#3A2618]/30" />
                      <span>200m+ Aydın Dağları</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-1.5 rounded-full bg-[#4B89B5]" />
                      <span>Tabakhane Deresi</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
