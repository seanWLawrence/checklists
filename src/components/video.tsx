export const Video: React.FC<{
  src: string;
}> = ({ src }) => {
  return (
    <video controls preload="metadata" className="w-full rounded-lg">
      <source src={src} />
      Your browser does not support the video element.
    </video>
  );
};
