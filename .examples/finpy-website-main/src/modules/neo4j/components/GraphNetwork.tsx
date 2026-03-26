'use client';

import React, { useState, useEffect } from 'react';
import { useNeo4j } from '../Neo4jContext';
import ForceGraph3D from 'react-force-graph-3d';

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
    <ForceGraph3D
      graphData={{ nodes, links }}
      nodeAutoColorBy='type'
      linkDirectionalParticles='value'
      nodeLabel='name'
      backgroundColor='black'
      height={700}
      width={1000}
    />
  );
}

export default GraphNetwork;
