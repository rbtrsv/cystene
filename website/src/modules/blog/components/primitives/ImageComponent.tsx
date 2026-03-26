import React from 'react';
import Image from 'next/image';

interface ImageComponentProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  alt,
  className = '',
  width = 100,
  height = 100,
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      className={`rounded-lg object-cover ${className}`}
      width={width}
      height={height}
      layout='fixed'
    />
  );
};

export default ImageComponent;
