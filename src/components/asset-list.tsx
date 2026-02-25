import { Audio } from "@/components/audio";
import { Image } from "@/components/image";
import { Button } from "./button";
import { JournalAsset } from "@/app/journals/journal.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { buttonClassName } from "./button-classes";

interface AssetListItem extends JournalAsset {
  previewUrl: string;
}

type TranscribeStatus = "idle" | "loading" | "done" | "error";

export const AssetList: React.FC<{
  assets: AssetListItem[];
  onRemoveClick?: (
    asset: Pick<AssetListItem, "filename" | "previewUrl">,
  ) => void;
  onCaptionChange?: (asset: AssetListItem, caption: string) => void;
  onTranscribeClick?: (asset: AssetListItem) => void;
  transcribeStatusByFilename?: Record<string, TranscribeStatus>;
  shouldShowTranscribeButton?: (
    asset: AssetListItem,
    status: TranscribeStatus | undefined,
  ) => boolean;
}> = ({
  assets,
  onRemoveClick,
  onCaptionChange,
  onTranscribeClick,
  transcribeStatusByFilename,
  shouldShowTranscribeButton,
}) => {
  const sortedAssets = [...assets].sort((a, b) =>
    a.variant.localeCompare(b.variant),
  );

  const getTranscribeLabel = (status: TranscribeStatus | undefined) => {
    switch (status) {
      case "loading":
        return "Transcribing...";
      case "done":
        return "Transcribed";
      case "error":
        return "Retry";
      default:
        return "Transcribe";
    }
  };

  if (!sortedAssets.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sortedAssets.map((asset) => {
        const transcribeStatus = transcribeStatusByFilename?.[asset.filename];

        return (
          <div key={asset.filename} className="space-y-0">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-900 dark:text-zinc-100 pb-1">
              <p className="truncate -mb-1">{asset.caption}</p>

              <div className="flex items-center gap-1">
                <div>
                  <a
                    href={asset.previewUrl}
                    download={asset.filename}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClassName({
                      variant: "ghost",
                      className: "text-xs",
                    })}
                  >
                    <span className="text-nowrap whitespace-nowrap">
                      Download
                    </span>
                  </a>
                </div>

                {onTranscribeClick &&
                  asset.variant === "audio" &&
                  (shouldShowTranscribeButton?.(asset, transcribeStatus) ??
                    true) && (
                    <Button
                      variant="ghost"
                      onClick={() => onTranscribeClick(asset)}
                      className="text-xs"
                      type="button"
                      disabled={transcribeStatus === "loading"}
                    >
                      {getTranscribeLabel(transcribeStatus)}
                    </Button>
                  )}

                {onRemoveClick && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onRemoveClick(asset)}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-2">
              {asset.variant === "image" ? (
                <Image src={asset.previewUrl} alt={asset.caption} />
              ) : (
                <Audio src={asset.previewUrl} />
              )}
            </div>

            {onCaptionChange && (
              <Label label="Caption" className="w-full">
                <Input
                  className="w-full"
                  value={asset.caption}
                  onChange={(event) =>
                    onCaptionChange(asset, event.target.value)
                  }
                />
              </Label>
            )}
          </div>
        );
      })}
    </div>
  );
};
