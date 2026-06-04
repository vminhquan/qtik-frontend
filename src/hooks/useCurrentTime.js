import { useEffect, useState } from "react";

const useCurrentTime = (intervalMs = 30000) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return currentTime;
};

export default useCurrentTime;
