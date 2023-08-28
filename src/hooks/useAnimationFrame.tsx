import { useEffect, useRef } from "react";

const useAnimationFrame = (
  enabled: boolean,
  callback: (time: number, delta: number) => void,
  deps: React.DependencyList
): void => {
  const frame = useRef<number>();
  const last = useRef(performance.now());
  const init = useRef(performance.now());

  const animate = () => {
    const now = performance.now();
    const time = (now - init.current) / 1000;
    const delta = (now - last.current) / 1000;
    callback(time, delta);
    last.current = now;
    frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!enabled) return;
    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, deps);
};

export { useAnimationFrame };
