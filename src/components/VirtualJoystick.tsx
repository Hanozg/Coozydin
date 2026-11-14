import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface VirtualJoystickProps {
  onChange: (axis: { x: number; y: number }) => void;
  size?: number;
  knobSize?: number;
  accent?: 'terracotta' | 'olive';
  label?: string;
  ariaLabel?: string;
}

const DEADZONE = 0.08;

export function VirtualJoystick({
  onChange,
  size = 112,
  knobSize = 46,
  accent = 'terracotta',
  label,
  ariaLabel = 'Yön Joysticki',
}: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [active, setActive] = useState(false);

  const maxTravel = Math.max(22, (size - knobSize) * 0.52);

  const applyKnobVisual = (px: number, py: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }
  };

  const emitFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxTravel);
    const angle = Math.atan2(dy, dx);
    const px = dist > 0.001 ? Math.cos(angle) * clampedDist : 0;
    const py = dist > 0.001 ? Math.sin(angle) * clampedDist : 0;

    applyKnobVisual(px, py);

    const normMag = clampedDist / maxTravel;
    if (normMag <= DEADZONE) {
      onChangeRef.current({ x: 0, y: 0 });
      return;
    }

    const scaled = (normMag - DEADZONE) / (1 - DEADZONE);
    const dirX = dist > 0.001 ? dx / dist : 0;
    const dirY = dist > 0.001 ? dy / dist : 0;
    // Screen Y down is positive, so invert for +1 = forward/up, -1 = backward/down
    onChangeRef.current({
      x: Math.max(-1, Math.min(1, dirX * scaled)),
      y: Math.max(-1, Math.min(1, -dirY * scaled)),
    });
  };

  const resetStick = () => {
    pointerIdRef.current = null;
    setActive(false);
    applyKnobVisual(0, 0);
    onChangeRef.current({ x: 0, y: 0 });
  };

  useEffect(() => {
    return () => {
      onChangeRef.current({ x: 0, y: 0 });
    };
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
    emitFromClient(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    emitFromClient(e.clientX, e.clientY);
  };

  const handlePointerUpOrCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resetStick();
  };

  const knobBg =
    accent === 'olive'
      ? active
        ? 'bg-[#4E793B] border-[#FAF2E2]'
        : 'bg-[#5D8A48] border-[#FAF2E2]/90'
      : active
        ? 'bg-[#B44D28] border-[#FAF2E2]'
        : 'bg-[#C85A32] border-[#FAF2E2]/90';

  const ringActiveBorder =
    accent === 'olive' ? 'border-[#5D8A48]' : 'border-[#C85A32]';

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-0.5 select-none">
      <div
        ref={baseRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuetext={active ? 'Aktif' : 'Merkez'}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onLostPointerCapture={() => resetStick()}
        onContextMenu={(e: ReactMouseEvent<HTMLDivElement>) => e.preventDefault()}
        style={{ width: size, height: size }}
        className={`relative rounded-full bg-[#F7EEDC]/92 border-2 ${
          active ? ringActiveBorder : 'border-[#B99464]'
        } shadow-lg flex items-center justify-center touch-none cursor-grab active:cursor-grabbing transition-colors`}
      >
        {/* Inner Guide Ring */}
        <div
          aria-hidden="true"
          className="absolute inset-2.5 rounded-full border border-dashed border-[#B99464]/55 pointer-events-none"
        />

        {/* Subtle Cardinal Dots */}
        <span
          aria-hidden="true"
          className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#9C7A52]/65 pointer-events-none"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#9C7A52]/65 pointer-events-none"
        />
        <span
          aria-hidden="true"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#9C7A52]/65 pointer-events-none"
        />
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#9C7A52]/65 pointer-events-none"
        />

        {/* Movable Analog Thumb Puck — moved directly via DOM transform for 0 React re-renders */}
        <div
          ref={knobRef}
          aria-hidden="true"
          style={{
            width: knobSize,
            height: knobSize,
            transform: 'translate3d(0px, 0px, 0)',
          }}
          className={`rounded-full border-2 ${knobBg} shadow-md flex items-center justify-center pointer-events-none ${
            active ? '' : 'transition-transform duration-150 ease-out'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-[#FAF2E2]/45" />
        </div>
      </div>

      {label && (
        <span className="text-[10px] font-bold tracking-wide text-[#3A2618] bg-[#F7EEDC]/92 border border-[#B99464]/70 px-2 py-0.5 rounded-md shadow-xs">
          {label}
        </span>
      )}
    </div>
  );
}
