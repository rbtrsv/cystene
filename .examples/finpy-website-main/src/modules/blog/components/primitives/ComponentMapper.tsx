import React from 'react';
import Text from '@/modules/blog/components/primitives/Text';
import ImageComponent from '@/modules/blog/components/primitives/ImageComponent';
import H1 from '@/modules/blog/components/primitives/H1';
// import RichText from './RichText';
// ... import other components as needed

interface ContentBlock {
  id: string; // Assuming each block has a unique ID for key prop in list rendering
  type: string;
  value: any;
}

const componentMap: { [key: string]: React.ElementType } = {
  text: Text,
  image: ImageComponent,
  h1: H1,
  // richText: RichText,
  // ... add more component mappings here
};

export default function ComponentMapper({ contentBlocks }: { contentBlocks: ContentBlock[] }) {
  // Error handling or loading states can be handled here if necessary

  return (
    <div> {/* This wrapper could have styling applied to it */}
      {contentBlocks.map((block, index) => {
        const Component = componentMap[block.type];

        if (!Component) {
          console.error(`Component for block type "${block.type}" not found.`);
          // Optionally render a fallback or error component
          // return <FallbackComponent key={block.id} />;
          return null; // or simply skip rendering this block
        }

        // Use block.id or index as key, preferring block.id when available
        return <Component key={block.id || index} {...block.value} />;
      })}
    </div>
  );
}