import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { cn } from "@/lib/cn";

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

export const AudioRecorderInput: React.FC<{
  id?: string;
  name: string;
  accept?: string;
  disabled?: boolean;
  className?: string;
  onFileSelected?: (file: File | null) => void;
}> = ({
  id,
  name,
  accept = "audio/*",
  disabled,
  className,
  onFileSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  const setFileOnInput = (file: File | null) => {
    const input = fileInputRef.current;

    if (!input) {
      return;
    }

    const dataTransfer = new DataTransfer();

    if (file) {
      dataTransfer.items.add(file);
    }

    input.files = dataTransfer.files;
  };

  const handleFileChange = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    onFileSelected?.(file);
  };

  const handleManualChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;

    handleFileChange(file);
  };

  const startRecording = async () => {
    if (!recorderAvailable || disabled) {
      setStatus("error");
      setErrorMessage("Recording isn't available on this device.");
      return;
    }

    if (status === "recording" || status === "paused") {
      return;
    }

    setErrorMessage(null);
    chunksRef.current = [];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setFileOnInput(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);

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
        const filename = `journal-audio-${Date.now()}.${extension}`;
        const file = new File([blob], filename, { type: mimeType });

        setFileOnInput(file);
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
  };

  const clearRecording = () => {
    setFileOnInput(null);
    handleFileChange(null);
    setStatus("idle");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {isMounted && recorderAvailable ? (
        <div className="flex items-center space-x-2">
          {(status === "idle" || status === "error") && (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="text-xs px-2 py-1 rounded border-2 border-zinc-900 disabled:opacity-60"
            >
              Record
            </button>
          )}

          {status === "recording" && (
            <button
              type="button"
              onClick={pauseRecording}
              disabled={disabled}
              className="text-xs px-2 py-1 rounded border-2 border-zinc-900 disabled:opacity-60"
            >
              Pause
            </button>
          )}

          {status === "paused" && (
            <button
              type="button"
              onClick={resumeRecording}
              disabled={disabled}
              className="text-xs px-2 py-1 rounded border-2 border-zinc-900 disabled:opacity-60"
            >
              Resume
            </button>
          )}

          {(status === "recording" || status === "paused") && (
            <button
              type="button"
              onClick={finishRecording}
              disabled={disabled}
              className="text-xs px-2 py-1 rounded border-2 border-zinc-900 disabled:opacity-60"
            >
              Finish
            </button>
          )}

          <button
            type="button"
            onClick={clearRecording}
            disabled={disabled || (!previewUrl && status !== "stopped")}
            className="text-xs px-2 py-1 rounded border-2 border-zinc-900 disabled:opacity-60"
          >
            Clear
          </button>

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

      {previewUrl && (
        <audio controls preload="metadata" className="w-full">
          <source src={previewUrl} />
          Your browser does not support the audio element.
        </audio>
      )}

      <input
        ref={fileInputRef}
        type="file"
        id={id}
        name={name}
        accept={accept}
        onChange={handleManualChange}
        disabled={disabled || status === "recording"}
        className="w-full max-w-prose text-sm"
      />
    </div>
  );
};
