"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type RecorderStatus = "idle" | "recording" | "paused" | "stopped" | "error";
type RecordingTranscriptionMode = "auto" | "skip";

const getExtensionForMime = (mimeType: string): string => {
  if (mimeType.includes("audio/webm")) return "webm";
  if (mimeType.includes("audio/ogg")) return "ogg";
  if (mimeType.includes("audio/mp4")) return "m4a";
  if (mimeType.includes("audio/mpeg")) return "mp3";
  if (mimeType.includes("audio/wav")) return "wav";

  return "webm";
};

const canRecordAudio = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    !!navigator.mediaDevices?.getUserMedia
  );
};

const getPreferredMimeType = (): string | undefined => {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) {
    return undefined;
  }

  const ua = navigator.userAgent;
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/i.test(ua);

  const safariCandidates = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4"];
  const defaultCandidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/ogg",
  ];

  const candidates = isSafari
    ? [...safariCandidates, ...defaultCandidates]
    : [...defaultCandidates, ...safariCandidates];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

const formatTimestamp = (date: Date): string => {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours24 >= 12 ? "PM" : "AM";

  return `${hours12}_${minutes}${meridiem}`;
};

export const AudioRecorderInput: React.FC<{
  onChangeAction: (
    file: File | null,
    options?: { transcriptionMode: RecordingTranscriptionMode },
  ) => void;
}> = ({ onChangeAction }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const wasAutoPausedRef = useRef(false);
  const transcriptionModeRef = useRef<RecordingTranscriptionMode>("auto");
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recorderAvailable = canRecordAudio();

  // Cleanup only
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      const recorder = mediaRecorderRef.current;

      if (!recorder) {
        return;
      }

      if (document.visibilityState === "hidden") {
        if (recorder.state === "recording") {
          // Flush data captured so far before mobile background/screen lock can suspend recording.
          recorder.requestData();

          try {
            recorder.pause();
            wasAutoPausedRef.current = true;
            setStatus("paused");
            setErrorMessage(
              "Recording auto-paused while app is in background. Return to continue.",
            );
          } catch {
            // If pause isn't supported in this state/browser, stop to preserve the recording.
            recorder.stop();
            setErrorMessage(
              "Recording was finalized while app was in background to prevent data loss.",
            );
          }
        }

        return;
      }

      if (wasAutoPausedRef.current && recorder.state === "paused") {
        recorder.resume();
        wasAutoPausedRef.current = false;
        setStatus("recording");
        setErrorMessage(null);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setStatus("idle");
    }

    onChangeAction(
      file,
      file
        ? { transcriptionMode: transcriptionModeRef.current }
        : { transcriptionMode: "auto" },
    );
  };

  const startRecording = async (
    transcriptionMode: RecordingTranscriptionMode = "auto",
  ) => {
    if (!recorderAvailable) {
      setStatus("error");
      setErrorMessage("Recording isn't available on this device.");
      return;
    }

    if (status === "recording" || status === "paused") {
      return;
    }

    setErrorMessage(null);
    wasAutoPausedRef.current = false;
    chunksRef.current = [];
    transcriptionModeRef.current = transcriptionMode;

    handleFileChange(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      const preferredMimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType: preferredMimeType,
        audioBitsPerSecond: 64_000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          setStatus("error");
          setErrorMessage("No audio captured. Try recording again.");
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;
          return;
        }

        const mimeType =
          recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = getExtensionForMime(mimeType);
        const filename = `${formatTimestamp(new Date())}.${extension}`;
        const file = new File([blob], filename, { type: mimeType });

        handleFileChange(file);

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setStatus("stopped");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setStatus("recording");
    } catch {
      setStatus("error");
      setErrorMessage("Microphone access is blocked or unavailable.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      wasAutoPausedRef.current = false;
      setStatus("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      wasAutoPausedRef.current = false;
      setErrorMessage(null);
      setStatus("recording");
    }
  };

  const finishRecording = () => {
    wasAutoPausedRef.current = false;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Hack for onstop to complete before resetting to idle
    setTimeout(() => {
      setStatus("idle");
    }, 1000);
  };

  return (
    <div className={"flex flex-col space-y-2"}>
      {recorderAvailable ? (
        <div
          className={cn("flex items-center space-x-2", {
            "border-zinc-200 rounded-md py-1.5 px-3 border-1":
              status !== "idle" && status !== "error",
          })}
        >
          {(status === "idle" || status === "error") && (
            <>
              <Button
                type="button"
                onClick={() => void startRecording("skip")}
                variant="outline"
              >
                Record
              </Button>

              <Button
                type="button"
                onClick={() => void startRecording("auto")}
                variant="outline"
              >
                Record w/ transcription
              </Button>
            </>
          )}

          {status === "recording" && (
            <Button type="button" variant="ghost" onClick={pauseRecording}>
              Pause
            </Button>
          )}

          {status === "paused" && (
            <Button type="button" variant="ghost" onClick={resumeRecording}>
              Resume
            </Button>
          )}

          {(status === "recording" || status === "paused") && (
            <Button type="button" variant="outline" onClick={finishRecording}>
              Finish
            </Button>
          )}

          {status === "recording" && (
            <span className="text-xs text-rose-600">Recording…</span>
          )}

          {status === "paused" && (
            <span className="text-xs text-zinc-600">Paused</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-600">
          Audio recording isn&apos;t supported on this device.
        </p>
      )}

      {errorMessage && <p className="text-xs text-rose-600">{errorMessage}</p>}
    </div>
  );
};
