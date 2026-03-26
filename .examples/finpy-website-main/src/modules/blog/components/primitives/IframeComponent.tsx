import React from 'react';

interface IframeComponentProps {
  src: string;
  title: string;
  width?: string;
  height?: string;
}

const IframeComponent: React.FC<IframeComponentProps> = ({
  src,
  title,
  width = '200',
  height = '113',
}) => {
  return (
    <iframe
      src={src}
      title={title}
      width={width}
      height={height}
      allowFullScreen
    ></iframe>
  );
};

export default IframeComponent;
