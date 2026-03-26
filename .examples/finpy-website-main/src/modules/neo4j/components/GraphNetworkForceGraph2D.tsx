'use client';

import React, { useState, useEffect } from 'react';
import { useNeo4j } from '../Neo4jContext';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  type: string;
  name: string;
}

interface Link {
  source: string;
  target: string;
}

function GraphNetwork() {
  const driver = useNeo4j();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const session = driver.session();
      try {
        const query = `
          MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
          RETURN p.name AS actor, m.title AS movie
        `;
        const result = await session.run(query);
        const tempNodes: Node[] = [];
        const tempLinks: Link[] = [];

        result.records.forEach((record) => {
          const actor = record.get('actor');
          const movie = record.get('movie');

          // Check if actor node already exists
          if (!tempNodes.some((node) => node.id === actor)) {
            tempNodes.push({ id: actor, type: 'Person', name: actor });
          }

          // Check if movie node already exists
          if (!tempNodes.some((node) => node.id === movie)) {
            tempNodes.push({ id: movie, type: 'Movie', name: movie });
          }

          // Add link
          tempLinks.push({ source: actor, target: movie });
        });

        setNodes(tempNodes);
        setLinks(tempLinks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        session.close();
      }
    };

    fetchData();
  }, [driver]);

  return (
    <ForceGraph2D
      graphData={{ nodes, links }}
      backgroundColor='#ffffff'
      nodeAutoColorBy='type'
      linkDirectionalParticles='value'
      nodeLabel={(node: Node) => node.name}
      nodeColor={(node) => (node.type === 'Person' ? '#ff0000' : '#0000ff')}
      enableNodeDrag={true}
      linkDirectionalArrowLength={10}
      enablePointerInteraction={true}
      nodeVal={(node) => (node.type === 'Person' ? 5 : 10)}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.name;
        const baseFontSize = 15;
        const adjustedFontSize = Math.max(
          baseFontSize / (1 + 3 * (1 - globalScale)),
          2
        );
        const nodeRadius = Math.max(adjustedFontSize * 1.5, 3);
        const color = node.type === 'Person' ? '#ff0000' : '#0000ff';

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.font = `${adjustedFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(label, node.x, node.y);
      }}
    />
  );
}

export default GraphNetwork;
