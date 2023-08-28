import { useCallback, useEffect } from "react";

// Based off a tweet and codesandbox:
// https://mobile.twitter.com/hieuhlc/status/1164369876825169920

function useKeyPress(targetKey: string, onKeyDown: () => void, onKeyUp: () => void): void {
  const downHandler = useCallback(
    ({ key }: KeyboardEvent) => {
      if (key === targetKey) onKeyDown();
    },
    [onKeyDown, targetKey]
  );

  const upHandler = useCallback(
    ({ key }: KeyboardEvent) => {
      if (key === targetKey) onKeyUp();
    },
    [onKeyUp, targetKey]
  );

  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [downHandler, upHandler]);
}

export { useKeyPress };
