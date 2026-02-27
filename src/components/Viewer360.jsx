// src/components/Viewer360.jsx
import { useEffect, useRef, useState, useCallback } from "react";

export default function Viewer360({ frames = [], alt = "360 view" }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]); // decoded HTMLImageElement cache
  const dragging = useRef(false);
  const lastX = useRef(0);
  const rafId = useRef(null);
  const pendingX = useRef(null);

  const total = frames.length;

  // ── Pre-load & decode images into memory ─────────────────────────────────
  useEffect(() => {
    setIndex(0);
    setLoaded(0);
    imagesRef.current = [];
    if (total === 0) return;

    let cancelled = false;
    let count = 0;
    const imgs = new Array(total).fill(null);

    frames.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgs[i] = img;
        count += 1;
        if (!cancelled) setLoaded(count);
        // Once all loaded, store the array
        if (count === total) imagesRef.current = imgs;
      };
      img.onerror = () => {
        count += 1;
        if (!cancelled) setLoaded(count);
        if (count === total) imagesRef.current = imgs;
      };
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [frames, total]);

  // ── Draw current frame on canvas ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    const container = containerRef.current;
    if (!container) return;

    // Match canvas pixel size to container display size for crisp rendering
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // object-contain: fit image inside canvas preserving aspect ratio
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = w / h;
    let drawW, drawH, offsetX, offsetY;

    if (imgAspect > canvasAspect) {
      drawW = w;
      drawH = w / imgAspect;
      offsetX = 0;
      offsetY = (h - drawH) / 2;
    } else {
      drawH = h;
      drawW = h * imgAspect;
      offsetX = (w - drawW) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }, [index, loaded]); // re-draw when index changes or when all images finish loading

  // ── Helpers ──────────────────────────────────────────────────────────────
  const clampIndex = useCallback(
    (i) => (total === 0 ? 0 : ((i % total) + total) % total),
    [total],
  );

  const flushMove = useCallback(() => {
    rafId.current = null;
    const clientX = pendingX.current;
    if (clientX === null || !dragging.current || total === 0) return;

    const dx = clientX - lastX.current;
    const step = Math.floor(dx / 10);
    if (step !== 0) {
      setIndex((prev) => clampIndex(prev - step));
      lastX.current = clientX;
    }
    pendingX.current = null;
  }, [total, clampIndex]);

  const scheduleMove = useCallback(
    (clientX) => {
      pendingX.current = clientX;
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(flushMove);
      }
    },
    [flushMove],
  );

  const stop = useCallback(() => {
    dragging.current = false;
    pendingX.current = null;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  // ── Mouse listeners (on window while dragging) ────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging.current) scheduleMove(e.clientX);
    };
    const handleMouseUp = () => stop();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      stop();
    };
  }, [scheduleMove, stop]);

  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;
  };

  // ── Touch listeners (on container) ────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      dragging.current = true;
      lastX.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
      if (dragging.current) {
        e.preventDefault();
        scheduleMove(e.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => stop();

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scheduleMove, stop]);

  // ── Resize: redraw on window resize so canvas stays sharp ─────────────
  useEffect(() => {
    const handleResize = () => setIndex((i) => i); // trigger re-draw
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────
  const onKeyDown = (e) => {
    if (total === 0) return;
    if (e.key === "ArrowLeft") setIndex((p) => clampIndex(p - 1));
    if (e.key === "ArrowRight") setIndex((p) => clampIndex(p + 1));
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="w-full h-[420px] rounded-xl border flex items-center justify-center text-gray-500">
        360° view not available
      </div>
    );
  }

  const isReady = loaded >= total;
  const progress = Math.round((loaded / total) * 100);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow select-none bg-gray-100"
      role="application"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseDown={isReady ? onMouseDown : undefined}
    >
      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-100">
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-700 transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            Loading 360° view… {progress}%
          </p>
        </div>
      )}

      {/* Canvas for fast frame drawing — no DOM layout thrash */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: isReady ? "block" : "none" }}
      />

      {/* Fallback: show first frame via <img> while loading */}
      {!isReady && frames[0] && (
        <img
          src={frames[0]}
          alt={alt}
          className="w-full h-full object-contain"
          draggable={false}
        />
      )}

      {isReady && (
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
          Drag to rotate • {index + 1}/{total}
        </div>
      )}
    </div>
  );
}
