// src/components/Viewer360.jsx
import { useEffect, useRef, useState } from "react";

export default function Viewer360({ frames = [], alt = "360 view" }) {
  const [index, setIndex] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  const total = frames.length;

  useEffect(() => {
    setIndex(0);
  }, [total]);

  // Preload frames for smoothness
  useEffect(() => {
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [frames]);

  const clampIndex = (i) => {
    if (total === 0) return 0;
    return (i + total) % total;
  };

  const move = (clientX) => {
    if (!dragging.current || total === 0) return;
    const dx = clientX - lastX.current;

    // sensitivity
    const step = Math.floor(dx / 10);
    if (step !== 0) {
      setIndex((prev) => clampIndex(prev - step));
      lastX.current = clientX;
    }
  };

  const stop = () => {
    dragging.current = false;
  };

  const onMouseDown = (e) => {
    dragging.current = true;
    lastX.current = e.clientX;
  };

  const onMouseMove = (e) => move(e.clientX);

  const onTouchStart = (e) => {
    dragging.current = true;
    lastX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => move(e.touches[0].clientX);

  const onKeyDown = (e) => {
    if (total === 0) return;
    if (e.key === "ArrowLeft") setIndex((p) => clampIndex(p - 1));
    if (e.key === "ArrowRight") setIndex((p) => clampIndex(p + 1));
  };

  if (total === 0) {
    return (
      <div className="w-full h-[420px] rounded-xl border flex items-center justify-center text-gray-500">
        360° view not available
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[420px] rounded-xl overflow-hidden shadow select-none"
      role="application"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={stop}
    >
      <img
        src={frames[index]}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />

      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
        Drag to rotate • {index + 1}/{total}
      </div>
    </div>
  );
}
