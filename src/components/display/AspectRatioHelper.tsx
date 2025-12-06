"use client";

import { useState, useEffect } from "react";
import { Maximize2 } from "lucide-react";

export function AspectRatioHelper() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOptimalRatio, setIsOptimalRatio] = useState(true);

  // Check if current window ratio is close to 16:9
  const checkAspectRatio = () => {
    if (typeof window === "undefined") return true;

    const currentRatio = window.innerWidth / window.innerHeight;
    const targetRatio = 16 / 9;
    const isOptimal = Math.abs(currentRatio - targetRatio) < 0.05; // 5% tolerance

    return isOptimal;
  };

  // Calculate optimal 16:9 dimensions
  const calculateOptimalDimensions = () => {
    const currentArea = window.innerWidth * window.innerHeight;
    const targetRatio = 16 / 9;

    let newHeight = Math.sqrt(currentArea / targetRatio);
    let newWidth = newHeight * targetRatio;

    // Ensure dimensions fit within screen
    const maxWidth = window.screen.availWidth;
    const maxHeight = window.screen.availHeight;

    if (newWidth > maxWidth || newHeight > maxHeight) {
      // Scale down to fit
      if (maxWidth / maxHeight > targetRatio) {
        // Height constrained
        newHeight = maxHeight * 0.9; // 90% of screen height for padding
        newWidth = newHeight * targetRatio;
      } else {
        // Width constrained
        newWidth = maxWidth * 0.9; // 90% of screen width for padding
        newHeight = newWidth / targetRatio;
      }
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  };

  // Handle window resize
  const handleResize = () => {
    try {
      const { width, height } = calculateOptimalDimensions();

      // Center the window on screen
      const left = Math.round((window.screen.availWidth - width) / 2);
      const top = Math.round((window.screen.availHeight - height) / 2);

      // Resize and reposition
      window.resizeTo(width, height);
      window.moveTo(left, top);
    } catch (error) {
      console.warn("Unable to resize window:", error);
    }
  };

  // Check aspect ratio on mount and window resize
  useEffect(() => {
    const updateRatio = () => {
      setIsOptimalRatio(checkAspectRatio());
    };

    updateRatio();
    window.addEventListener("resize", updateRatio);

    return () => {
      window.removeEventListener("resize", updateRatio);
    };
  }, []);

  // Track mouse position
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is in bottom-right quarter
      const isInBottomRight =
        e.clientX > window.innerWidth * 0.75 &&
        e.clientY > window.innerHeight * 0.75;

      // Clear any existing hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }

      if (isInBottomRight && !isOptimalRatio) {
        setIsVisible(true);
      } else {
        // Add small delay before hiding for better UX
        hideTimeout = setTimeout(() => {
          setIsVisible(false);
        }, 300);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isOptimalRatio]);

  // Don't render if already optimal or in fullscreen
  if (isOptimalRatio) return null;

  return (
    <button
      onClick={handleResize}
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-2
        px-4 py-3
        bg-background/90 backdrop-blur-sm
        border border-border
        rounded-lg
        shadow-lg
        text-sm font-medium
        transition-opacity duration-300
        hover:bg-background
        focus:outline-none focus:ring-2 focus:ring-primary
        ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      aria-label="Optimize window for 16:9 display"
    >
      <Maximize2 className="w-4 h-4" />
      <span>Optimize for 16:9</span>
    </button>
  );
}
