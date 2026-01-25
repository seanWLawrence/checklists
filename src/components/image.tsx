import NextImage from "next/image";

export const Image: React.FC<{
  src: string;
  alt: string;
}> = ({ src, alt }) => {
  return (
    <NextImage
      src={src}
      alt={alt}
      width={1200}
      height={800}
      className="w-full h-auto rounded-lg"
      sizes="(max-width: 768px) 100vw, 720px"
    />
  );
};
