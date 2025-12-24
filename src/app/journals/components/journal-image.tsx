import Image from "next/image";

export const JournalImage: React.FC<{
  imageUrl?: string;
}> = ({ imageUrl }) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <Image
      src={imageUrl}
      alt={"Journal image"}
      width={1200}
      height={800}
      className="w-full h-auto rounded-lg border-2 border-zinc-900"
      sizes="(max-width: 768px) 100vw, 720px"
    />
  );
};
