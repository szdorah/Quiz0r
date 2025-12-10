"use client";

import { useState, useEffect } from "react";
import { Maximize2 } from "lucide-react";

export function AspectRatioHelper() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOptimalRatio, setIsOptimalRatio] = useState(true);

  // Check if current window is close to 16:9 and large enough to show content
  const checkAspectRatio = () => {
    if (typeof window === "undefined") return true;

    const currentRatio = window.innerWidth / window.innerHeight;
    const targetRatio = 16 / 9;
    const isOptimal = Math.abs(currentRatio - targetRatio) < 0.05; // 5% tolerance
    // Also require the window to use most of the available screen so content isn't clipped
    const fillEnough =
      window.innerWidth >= window.screen.availWidth * 0.85 &&
      window.innerHeight >= window.screen.availHeight * 0.85;

    return isOptimal && fillEnough;
  };

  // Calculate optimal 16:9 dimensions using ~90% of available screen
  const calculateOptimalDimensions = () => {
    const targetRatio = 16 / 9;

    const maxWidth = window.screen.availWidth;
    const maxHeight = window.screen.availHeight;

    // Start by using 90% of available width
    let newWidth = maxWidth * 0.9;
    let newHeight = newWidth / targetRatio;

    // If height would exceed 90% of available height, clamp to height instead
    if (newHeight > maxHeight * 0.9) {
      newHeight = maxHeight * 0.9;
      newWidth = newHeight * targetRatio;
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

  // Auto-adjust window to 16:9 on first load if needed
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (checkAspectRatio()) return;

    // Small delay so the new window finishes opening before resize/move
    const timeout = setTimeout(() => {
      if (!checkAspectRatio()) {
        handleResize();
      }
    }, 150);

    return () => clearTimeout(timeout);
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
