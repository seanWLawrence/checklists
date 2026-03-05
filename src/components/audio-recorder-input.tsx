"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type RecorderStatus = "idle" | "recording" | "paused" | "error";
type RecordingTranscriptionMode = "auto" | "skip";

const getExtensionForMime = (mimeType: string): string => {
  if (mimeType.includes("audio/webm")) return "webm";
  if (mimeType.includes("audio/ogg")) return "ogg";
  if (mimeType.includes("audio/mp4")) return "m4a";
  if (mimeType.includes("audio/mpeg")) return "mp3";
  if (mimeType.includes("audio/wav")) return "wav";

  return "webm";
};

export const normalizeRecordedMimeType = (mimeType: string): string => {
  if (mimeType.includes("audio/webm")) return "audio/webm";
  if (mimeType.includes("audio/ogg")) return "audio/ogg";
  if (mimeType.includes("audio/mp4")) return "audio/mp4";
  if (mimeType.includes("audio/mpeg")) return "audio/mpeg";
  if (mimeType.includes("audio/wav")) return "audio/wav";

  return mimeType;
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
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  const meridiem = hours24 >= 12 ? "PM" : "AM";

  return `${hours12}_${minutes}_${seconds}_${milliseconds}${meridiem}`;
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
  const isFinishingRef = useRef(false);
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

  const teardownMedia = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const finalizeRecording = (mimeTypeHint?: string) => {
    isFinishingRef.current = false;

    if (chunksRef.current.length === 0) {
      setStatus("error");
      setErrorMessage("No audio captured. Try recording again.");
      teardownMedia();
      return;
    }

    const fallbackMimeType = chunksRef.current[0]?.type || "audio/webm";
    const recorderMimeType = mimeTypeHint || fallbackMimeType;
    const mimeType = normalizeRecordedMimeType(recorderMimeType);
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const extension = getExtensionForMime(recorderMimeType);
    const filename = `${formatTimestamp(new Date())}.${extension}`;
    const file = new File([blob], filename, { type: mimeType });

    handleFileChange(file);
    teardownMedia();
    setStatus("idle");
  };

  const createRecorder = (stream: MediaStream, preferredMimeType?: string) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: preferredMimeType,
      audioBitsPerSecond: 64_000,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onpause = () => {
      setStatus("paused");
    };

    recorder.onresume = () => {
      setStatus("recording");
      setErrorMessage(null);
    };

    recorder.onstop = () => {
      if (wasAutoPausedRef.current && !isFinishingRef.current) {
        mediaRecorderRef.current = null;
        setStatus("paused");
        return;
      }

      finalizeRecording(recorder.mimeType);
    };

    return recorder;
  };

  const startRecorderSegment = async ({
    resetChunks,
    transcriptionMode,
  }: {
    resetChunks: boolean;
    transcriptionMode?: RecordingTranscriptionMode;
  }) => {
    if (resetChunks) {
      chunksRef.current = [];
      wasAutoPausedRef.current = false;
      isFinishingRef.current = false;
      setErrorMessage(null);
      transcriptionModeRef.current = transcriptionMode ?? "auto";
      handleFileChange(null);
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
      },
    });
    streamRef.current = stream;
    const preferredMimeType = getPreferredMimeType();
    const recorder = createRecorder(stream, preferredMimeType);

    mediaRecorderRef.current = recorder;
    recorder.start(1000);
    setStatus("recording");
    setErrorMessage(null);
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

    try {
      await startRecorderSegment({ resetChunks: true, transcriptionMode });
    } catch {
      setStatus("error");
      setErrorMessage("Microphone access is blocked or unavailable.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        wasAutoPausedRef.current = false;
      } catch {
        setStatus("error");
        setErrorMessage("Unable to pause recording right now.");
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      try {
        mediaRecorderRef.current.resume();
        wasAutoPausedRef.current = false;
      } catch {
        setErrorMessage("Unable to resume recording. Try finishing instead.");
      }
      return;
    }

    if (
      status === "paused" &&
      wasAutoPausedRef.current &&
      chunksRef.current.length > 0
    ) {
      void startRecorderSegment({ resetChunks: false }).catch(() => {
        setErrorMessage("Unable to resume recording. Try finishing instead.");
      });
    }
  };

  const finishRecording = () => {
    wasAutoPausedRef.current = false;

    if (mediaRecorderRef.current) {
      isFinishingRef.current = true;
      mediaRecorderRef.current.stop();
      return;
    }

    if (chunksRef.current.length > 0) {
      finalizeRecording();
    }
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
                Record + transcribe
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
