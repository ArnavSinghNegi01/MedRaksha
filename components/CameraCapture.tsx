// components/CameraCapture.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onError: (reason: "denied" | "unavailable") => void;
}

export default function CameraCapture({
  onCapture,
  onCancel,
  onError,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop all active media tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore error on stop
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      // Check for getUserMedia support
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        onError("unavailable");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay will proceed with muted + playsInline
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        const errName = err?.name || "";
        if (
          errName === "NotAllowedError" ||
          errName === "PermissionDeniedError"
        ) {
          onError("denied");
        } else {
          onError("unavailable");
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopTracks();
    };
  }, [onError, stopTracks]);

  // Handle Cancel action
  const handleCancel = useCallback(() => {
    stopTracks();
    onCancel();
  }, [stopTracks, onCancel]);

  // Handle Capture action
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    // Draw the current video frame into a canvas (longest side at most 1280 px)
    const maxSide = 1280;
    let width = vw;
    let height = vh;

    if (width > maxSide || height > maxSide) {
      if (width > height) {
        height = Math.round((height * maxSide) / width);
        width = maxSide;
      } else {
        width = Math.round((width * maxSide) / height);
        height = maxSide;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Export with canvas.toBlob("image/jpeg", 0.8)
    canvas.toBlob(
      (blob) => {
        // Stop all stream tracks
        stopTracks();

        // Set canvas width and height to 0
        canvas.width = 0;
        canvas.height = 0;

        if (!blob) {
          onError("unavailable");
          return;
        }

        // Pass the blob as a File ("photo.jpg", type image/jpeg)
        const file = new File([blob], "photo.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        // Close overlay and pass file
        onCapture(file);
      },
      "image/jpeg",
      0.8
    );
  }, [onCapture, onError, stopTracks]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Camera scanner"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Background Live Video Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Viewfinder frame overlay guide */}
      <div className="absolute inset-6 sm:inset-12 border-2 border-white/30 rounded-3xl pointer-events-none flex flex-col justify-between p-4">
        <div className="flex justify-between w-full">
          <div className="w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
          <div className="w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
        </div>
        <div className="flex justify-between w-full">
          <div className="w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
          <div className="w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
        </div>
      </div>

      {/* Top Header with Cancel Button */}
      <div className="relative z-10 pt-4 px-4 sm:pt-6 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs sm:text-sm font-bold hover:bg-black/70 active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Bottom Controls with Hint and Large Round Capture Button */}
      <div className="relative z-10 pb-8 sm:pb-12 pt-4 px-4 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Small hint */}
        <p className="text-white/90 text-xs sm:text-sm font-semibold tracking-wide bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm text-center">
          Hold the document flat and fill the frame
        </p>

        {/* Large round Capture button */}
        <button
          type="button"
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/40"
          aria-label="Capture document photo"
        >
          <div className="w-full h-full bg-white rounded-full hover:bg-gray-100 transition-colors" />
        </button>
      </div>
    </div>
  );
}
