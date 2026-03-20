"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type RecorderStatus = "idle" | "recording" | "paused" | "error";
type RecordingTranscriptionMode = "auto" | "skip";
type BackgroundPauseStrategy = "pause" | "segment";
type RecordedAudioSegment = {
  blob: Blob;
  mimeType: string;
};

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

const getAudioContextConstructor = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };

  return globalThis.AudioContext ?? browserWindow.webkitAudioContext ?? null;
};

const mergeAudioBuffersToWav = (buffers: AudioBuffer[]): Blob => {
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const channelCount = Math.max(...buffers.map((buffer) => buffer.numberOfChannels));
  const sampleRate = buffers[0]!.sampleRate;
  const mergedBuffer = new AudioBuffer({
    length: totalLength,
    numberOfChannels: channelCount,
    sampleRate,
  });

  let offset = 0;

  buffers.forEach((buffer) => {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
      mergedBuffer
        .getChannelData(channel)
        .set(buffer.getChannelData(sourceChannel), offset);
    }

    offset += buffer.length;
  });

  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const pcmDataLength = mergedBuffer.length * blockAlign;
  const outputBuffer = new ArrayBuffer(44 + pcmDataLength);
  const view = new DataView(outputBuffer);
  let position = 0;

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(position, value.charCodeAt(i));
      position += 1;
    }
  };

  writeString("RIFF");
  view.setUint32(position, 36 + pcmDataLength, true);
  position += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(position, 16, true);
  position += 4;
  view.setUint16(position, 1, true);
  position += 2;
  view.setUint16(position, channelCount, true);
  position += 2;
  view.setUint32(position, sampleRate, true);
  position += 4;
  view.setUint32(position, byteRate, true);
  position += 4;
  view.setUint16(position, blockAlign, true);
  position += 2;
  view.setUint16(position, 16, true);
  position += 2;
  writeString("data");
  view.setUint32(position, pcmDataLength, true);
  position += 4;

  for (let sampleIndex = 0; sampleIndex < mergedBuffer.length; sampleIndex += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(
        -1,
        Math.min(1, mergedBuffer.getChannelData(channel)[sampleIndex] ?? 0),
      );
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(position, int16, true);
      position += bytesPerSample;
    }
  }

  return new Blob([outputBuffer], { type: "audio/wav" });
};

const mergeSegmentsForExport = async (
  segments: RecordedAudioSegment[],
): Promise<{ blob: Blob; mimeType: string; extension: string }> => {
  if (segments.length === 1) {
    const mimeType = normalizeRecordedMimeType(segments[0]!.mimeType);

    return {
      blob: new Blob([segments[0]!.blob], { type: mimeType }),
      mimeType,
      extension: getExtensionForMime(mimeType),
    };
  }

  const AudioContextCtor = getAudioContextConstructor();

  if (!AudioContextCtor) {
    const fallbackMimeType = normalizeRecordedMimeType(segments[0]!.mimeType);

    return {
      blob: new Blob(
        segments.map((segment) => segment.blob),
        {
          type: fallbackMimeType,
        },
      ),
      mimeType: fallbackMimeType,
      extension: getExtensionForMime(fallbackMimeType),
    };
  }

  const context = new AudioContextCtor();

  try {
    const buffers = await Promise.all(
      segments.map(async (segment) => {
        const arrayBuffer = await segment.blob.arrayBuffer();

        return context.decodeAudioData(arrayBuffer.slice(0));
      }),
    );

    const wavBlob = mergeAudioBuffersToWav(buffers);

    return {
      blob: wavBlob,
      mimeType: "audio/wav",
      extension: "wav",
    };
  } finally {
    await context.close();
  }
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

export const getBackgroundPauseStrategy = ({
  userAgent,
  platform,
  maxTouchPoints,
}: {
  userAgent: string;
  platform: string;
  maxTouchPoints?: number;
}): BackgroundPauseStrategy => {
  const touchPoints = maxTouchPoints ?? 0;
  const isIOSDevice = /iPad|iPhone|iPod/i.test(userAgent);
  const isIPadOS = platform === "MacIntel" && touchPoints > 1;

  return isIOSDevice || isIPadOS ? "segment" : "pause";
};

const shouldSegmentOnBackgroundPause = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    getBackgroundPauseStrategy({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    }) === "segment"
  );
};

export const shouldRetryGetUserMediaWithoutConstraints = (
  error: unknown,
): boolean => {
  return (
    (error instanceof DOMException && error.name === "OverconstrainedError") ||
    error instanceof TypeError
  );
};

export const getMicrophoneAccessErrorMessage = (error: unknown): string => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "SecurityError":
        return "Microphone access was denied. Check browser or iOS app settings and try again.";
      case "NotFoundError":
        return "No microphone was found on this device.";
      case "NotReadableError":
        return "The microphone is already in use by another app.";
      case "OverconstrainedError":
        return "This device rejected the preferred microphone settings. Try again.";
    }
  }

  return "Microphone access is unavailable right now. Please try again.";
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
  shouldShowTranscribeOption?: boolean;
  buttonClassName?: string;
}> = ({ onChangeAction, shouldShowTranscribeOption = true, buttonClassName }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkBufferRef = useRef<Blob[]>([]);
  const recordedSegmentsRef = useRef<RecordedAudioSegment[]>([]);
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
          wasAutoPausedRef.current = true;

          if (shouldSegmentOnBackgroundPause()) {
            // iOS/WebKit often fails to append chunks after pause/resume once backgrounded.
            recorder.stop();
            setStatus("paused");
            setErrorMessage(
              "Recording auto-paused while app was in background. Return to continue.",
            );
            return;
          }

          try {
            recorder.pause();
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

  const persistCurrentSegment = (mimeTypeHint?: string) => {
    if (chunkBufferRef.current.length === 0) {
      return;
    }

    const fallbackMimeType = chunkBufferRef.current[0]?.type || "audio/webm";
    const mimeType = normalizeRecordedMimeType(mimeTypeHint || fallbackMimeType);
    const blob = new Blob(chunkBufferRef.current, { type: mimeType });

    recordedSegmentsRef.current.push({ blob, mimeType });
    chunkBufferRef.current = [];
  };

  const finalizeRecording = async () => {
    isFinishingRef.current = false;

    if (recordedSegmentsRef.current.length === 0) {
      setStatus("error");
      setErrorMessage("No audio captured. Try recording again.");
      teardownMedia();
      return;
    }

    let output:
      | { blob: Blob; mimeType: string; extension: string }
      | undefined;

    try {
      output = await mergeSegmentsForExport(recordedSegmentsRef.current);
    } catch {
      const fallback = recordedSegmentsRef.current[0]!;
      output = {
        blob: new Blob(
          recordedSegmentsRef.current.map((segment) => segment.blob),
          {
            type: fallback.mimeType,
          },
        ),
        mimeType: fallback.mimeType,
        extension: getExtensionForMime(fallback.mimeType),
      };
    }

    const filename = `${formatTimestamp(new Date())}.${output.extension}`;
    const file = new File([output.blob], filename, { type: output.mimeType });

    handleFileChange(file);
    recordedSegmentsRef.current = [];
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
        chunkBufferRef.current.push(event.data);
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
      persistCurrentSegment(recorder.mimeType);

      if (wasAutoPausedRef.current && !isFinishingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) {
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        setStatus("paused");
        return;
      }

      void finalizeRecording();
    };

    return recorder;
  };

  const getAudioStream = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
        },
      });
    } catch (error) {
      if (shouldRetryGetUserMediaWithoutConstraints(error)) {
        return navigator.mediaDevices.getUserMedia({ audio: true });
      }

      throw error;
    }
  };

  const startRecorderSegment = async ({
    resetChunks,
    transcriptionMode,
  }: {
    resetChunks: boolean;
    transcriptionMode?: RecordingTranscriptionMode;
  }) => {
    if (resetChunks) {
      chunkBufferRef.current = [];
      recordedSegmentsRef.current = [];
      wasAutoPausedRef.current = false;
      isFinishingRef.current = false;
      setErrorMessage(null);
      transcriptionModeRef.current = transcriptionMode ?? "auto";
      handleFileChange(null);
    }

    const stream = await getAudioStream();
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
    } catch (error) {
      setStatus("error");
      setErrorMessage(getMicrophoneAccessErrorMessage(error));
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
      recordedSegmentsRef.current.length > 0
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

    if (recordedSegmentsRef.current.length > 0) {
      void finalizeRecording();
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
                className={buttonClassName}
              >
                Record
              </Button>

              {shouldShowTranscribeOption && (
                <Button
                  type="button"
                  onClick={() => void startRecording("auto")}
                  variant="outline"
                >
                  Record + transcribe
                </Button>
              )}
            </>
          )}

          {status === "recording" && (
            <Button type="button" variant="ghost" className={buttonClassName} onClick={pauseRecording}>
              Pause
            </Button>
          )}

          {status === "paused" && (
            <Button type="button" variant="ghost" className={buttonClassName} onClick={resumeRecording}>
              Resume
            </Button>
          )}

          {(status === "recording" || status === "paused") && (
            <Button type="button" variant="outline" className={buttonClassName} onClick={finishRecording}>
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
