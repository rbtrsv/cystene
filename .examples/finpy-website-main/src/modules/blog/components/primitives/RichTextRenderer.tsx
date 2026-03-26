import React from 'react';
import IframeComponent from '@/modules/blog/components/primitives/IframeComponent';
import H1 from '@/modules/blog/components/primitives/H1';
import H2 from '@/modules/blog/components/primitives/H2';
import H3 from '@/modules/blog/components/primitives/H3';
import ImageComponent from '@/modules/blog/components/primitives/ImageComponent';
import LinkComponent from '@/modules/blog/components/primitives/LinkComponent';
import Text from '@/modules/blog/components/primitives/Text';
import UL from '@/modules/blog/components/primitives/UL';
import OL from '@/modules/blog/components/primitives/OL';
import LI from '@/modules/blog/components/primitives/LI';

interface ContentBlock {
  type: string;
  value: string;
}

interface RichTextProps {
  block: ContentBlock;
}

const RichTextRenderer: React.FC<RichTextProps> = ({ block }) => {
  const renderContent = (): React.JSX.Element | null => {
    const { type, value } = block;

    if (type === 'richtext') {
      const domParser = new DOMParser();
      const htmlDocument = domParser.parseFromString(value, 'text/html');
      const body = htmlDocument.body;

      const processNodesRecursive = (node: ChildNode, key: string): React.ReactNode => {
        switch (node.nodeName.toLowerCase()) {
          case 'iframe': {
            const { src, title, width, height } = node as HTMLIFrameElement;
            return <IframeComponent key={key} src={src} title={title || 'Embedded content'} width={width} height={height} />;
          }
          case 'h1': {
            return <H1 key={key}>{node.textContent}</H1>;
          }
          case 'h2': {
            return <H2 key={key}>{node.textContent}</H2>;
          }
          case 'h3': {
            return <H3 key={key}>{node.textContent}</H3>;
          }
          case 'p': {
            return <Text key={key}>{node.textContent}</Text>;
          }
          case 'a': {
            const { href } = node as HTMLAnchorElement;
            return <LinkComponent key={key} href={href}>{node.textContent}</LinkComponent>;
          }
          case 'img': {
            const { src, alt } = node as HTMLImageElement;
            return <ImageComponent key={key} src={src} alt={alt || ''} />;
          }
          case 'ul': {
            const listItems = Array.from(node.childNodes).map((childNode, index) =>
              processNodesRecursive(childNode, `${key}-${index}`));
            return <UL key={key}>{listItems}</UL>;
          }
          case 'ol': {
            const listItems = Array.from(node.childNodes).map((childNode, index) =>
              processNodesRecursive(childNode, `${key}-${index}`));
            return <OL key={key}>{listItems}</OL>;
          }
          case 'li': {
            return <LI key={key}>{node.textContent}</LI>;
          }
          default: {
            // If the node has child nodes, recurse; otherwise, return null.
            return node.hasChildNodes() ? (
              <React.Fragment key={key}>
                {Array.from(node.childNodes).map((childNode, index) =>
                  processNodesRecursive(childNode, `${key}-${index}`),
                )}
              </React.Fragment>
            ) : null;
          }
        }
      };

      return (
        <>
          {Array.from(body.childNodes).map((node, index) =>
            processNodesRecursive(node, `node-${index}`),
          )}
        </>
      );
    }

    return null;
  };

  return <>{renderContent()}</>;
};

export default RichTextRenderer;
