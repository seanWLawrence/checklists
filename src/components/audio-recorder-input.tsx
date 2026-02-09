import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type RecorderStatus = "idle" | "recording" | "paused" | "stopped" | "error";

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

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/ogg",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

const formatTimestamp = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

export const AudioRecorderInput: React.FC<{
  onChange: (file: File | null) => void;
}> = ({ onChange }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Avoids setting state in effect
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  // Avoids setting state in effect
  const recorderAvailable = useSyncExternalStore(
    () => () => {},
    () => canRecordAudio(),
    () => false,
  );

  // Cleanup only
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setStatus("idle");
    }

    onChange(file);
  };

  const startRecording = async () => {
    if (!recorderAvailable) {
      setStatus("error");
      setErrorMessage("Recording isn't available on this device.");
      return;
    }

    if (status === "recording" || status === "paused") {
      return;
    }

    setErrorMessage(null);
    chunksRef.current = [];

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
      recorder.start();
      setStatus("recording");
    } catch {
      setStatus("error");
      setErrorMessage("Microphone access is blocked or unavailable.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  };

  const finishRecording = () => {
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
      {isMounted && recorderAvailable ? (
        <div
          className={cn("flex items-center space-x-2", {
            "border-zinc-200 rounded-md py-1.5 px-3 border-1":
              status !== "idle" && status !== "error",
          })}
        >
          {(status === "idle" || status === "error") && (
            <Button type="button" onClick={startRecording} variant="outline">
              Record
            </Button>
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
      ) : isMounted ? (
        <p className="text-xs text-zinc-600">
          Audio recording isn&apos;t supported on this device.
        </p>
      ) : null}

      {errorMessage && <p className="text-xs text-rose-600">{errorMessage}</p>}
    </div>
  );
};
