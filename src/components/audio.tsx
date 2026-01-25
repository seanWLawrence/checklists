export const Audio: React.FC<{
  src: string;
}> = ({ src }) => {
  return (
    <audio controls preload="metadata" className="w-full">
      <source src={src} />
      Your browser does not support the audio element.
    </audio>
  );
};
