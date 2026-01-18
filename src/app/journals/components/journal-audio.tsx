export const JournalAudio: React.FC<{
  audioUrl?: string;
}> = ({ audioUrl }) => {
  if (!audioUrl) {
    return null;
  }

  return (
    <audio
      controls
      preload="metadata"
      className="w-full rounded-lg border-2 border-zinc-900"
    >
      <source src={audioUrl} />
      Your browser does not support the audio element.
    </audio>
  );
};
