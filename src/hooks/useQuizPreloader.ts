"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { QuizPreloadData } from "@/types";

interface PreloadProgress {
  totalAssets: number;
  loadedAssets: number;
  percentage: number;
  status: 'idle' | 'loading' | 'complete' | 'error';
  currentFile?: string;
}

interface UseQuizPreloaderProps {
  gameCode: string;
  playerId?: string;
  socket: Socket | null;
}

export function useQuizPreloader({ gameCode, playerId, socket }: UseQuizPreloaderProps) {
  const [progress, setProgress] = useState<PreloadProgress>({
    totalAssets: 0,
    loadedAssets: 0,
    percentage: 0,
    status: 'idle',
  });
  const [quizData, setQuizData] = useState<QuizPreloadData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastProgressReport = useRef(0);
  const progressReportTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const playerIdRef = useRef(playerId);

  // Keep playerIdRef in sync with playerId prop
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  // Throttled progress reporting to avoid socket spam
  const reportProgress = (currentProgress: PreloadProgress) => {
    if (!socket || !playerIdRef.current) {
      console.log('[Preloader] Cannot report progress - socket or playerId missing:', { socket: !!socket, playerId: playerIdRef.current });
      return;
    }

    const now = Date.now();
    const timeSinceLastReport = now - lastProgressReport.current;

    // Clear existing timeout
    if (progressReportTimeout.current) {
      clearTimeout(progressReportTimeout.current);
    }

    // Report immediately if enough time has passed or if complete/error
    if (
      timeSinceLastReport >= 500 ||
      currentProgress.status === 'complete' ||
      currentProgress.status === 'error'
    ) {
      console.log(`[Preloader] Reporting progress: ${currentProgress.percentage}% (${currentProgress.loadedAssets}/${currentProgress.totalAssets})`);
      socket.emit('player:preloadProgress', {
        gameCode,
        playerId: playerIdRef.current,
        percentage: currentProgress.percentage,
        loadedAssets: currentProgress.loadedAssets,
        totalAssets: currentProgress.totalAssets,
        status: currentProgress.status,
      });
      lastProgressReport.current = now;
    } else {
      // Schedule report after throttle period
      progressReportTimeout.current = setTimeout(() => {
        socket.emit('player:preloadProgress', {
          gameCode,
          playerId: playerIdRef.current,
          percentage: currentProgress.percentage,
          loadedAssets: currentProgress.loadedAssets,
          totalAssets: currentProgress.totalAssets,
          status: currentProgress.status,
        });
        lastProgressReport.current = Date.now();
      }, 500 - timeSinceLastReport);
    }
  };

  // Preload images in batches
  const preloadImages = async (urls: string[]) => {
    if (urls.length === 0) {
      setProgress({
        totalAssets: 0,
        loadedAssets: 0,
        percentage: 100,
        status: 'complete',
      });
      setIsReady(true);
      if (socket && playerIdRef.current) {
        socket.emit('player:preloadProgress', {
          gameCode,
          playerId: playerIdRef.current,
          percentage: 100,
          loadedAssets: 0,
          totalAssets: 0,
          status: 'complete',
        });
      }
      return;
    }

    const totalAssets = urls.length;
    let loadedAssets = 0;
    const batchSize = 5; // Load 5 images concurrently

    setProgress({
      totalAssets,
      loadedAssets: 0,
      percentage: 0,
      status: 'loading',
    });

    const updateProgress = () => {
      const percentage = Math.round((loadedAssets / totalAssets) * 100);
      const newProgress: PreloadProgress = {
        totalAssets,
        loadedAssets,
        percentage,
        status: loadedAssets === totalAssets ? 'complete' : 'loading',
      };

      setProgress(newProgress);
      reportProgress(newProgress);

      if (loadedAssets === totalAssets) {
        setIsReady(true);
      }
    };

    // Load images in batches
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map((url) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
              loadedAssets++;
              updateProgress();
              resolve();
            };

            img.onerror = () => {
              // Continue even if image fails to load
              console.warn(`Failed to preload image: ${url}`);
              loadedAssets++;
              updateProgress();
              resolve(); // Resolve instead of reject to continue
            };

            img.src = url;
          })
        )
      );
    }
  };

  // Listen for quiz data preload event
  useEffect(() => {
    if (!socket) {
      console.log('[Preloader] No socket available yet');
      return;
    }

    console.log('[Preloader] Setting up socket listener for player:', playerId);

    const handleQuizDataPreload = async (data: QuizPreloadData) => {
      console.log('[Preloader] Received quiz data preload:', data);
      setQuizData(data);

      // Extract all image URLs
      const imageUrls = data.imageUrls.filter((url): url is string => !!url);
      console.log(`[Preloader] Starting to preload ${imageUrls.length} images`);

      // Start preloading
      await preloadImages(imageUrls);
    };

    // Clear data when game ends or is cancelled
    const handleGameEnd = () => {
      console.log('Game ended, clearing preloaded data');
      clearPreloadedData();
    };

    const handleGameCancelled = () => {
      console.log('Game cancelled, clearing preloaded data');
      clearPreloadedData();
    };

    socket.on('game:quizDataPreload', handleQuizDataPreload);
    socket.on('game:finished', handleGameEnd);
    socket.on('game:cancelled', handleGameCancelled);

    // Clean up on unmount (player leaving)
    return () => {
      socket.off('game:quizDataPreload', handleQuizDataPreload);
      socket.off('game:finished', handleGameEnd);
      socket.off('game:cancelled', handleGameCancelled);

      if (progressReportTimeout.current) {
        clearTimeout(progressReportTimeout.current);
      }

      // Clear data when component unmounts
      clearPreloadedData();
    };
  }, [socket, gameCode, playerId]);

  // Function to clear preloaded data
  const clearPreloadedData = () => {
    setQuizData(null);
    setProgress({
      totalAssets: 0,
      loadedAssets: 0,
      percentage: 0,
      status: 'idle',
    });
    setIsReady(false);
  };

  return {
    progress,
    quizData,
    isReady,
    clearPreloadedData,
  };
}
