'use client';

// import MovieActorsList from "@/modules/neo4j/components/MovieActorsList";
// import GraphNetwork from '@/modules/neo4j/components/GraphNetwork';

import dynamic from 'next/dynamic';

const GraphNetwork = dynamic(
  () => import('@/modules/neo4j/components/GraphNetworkForceGraph2D'),
  { ssr: false } // This will load the component only on the client side
);

export default function Neo4j() {
  return (
    <div className='h-full w-full'>
      {/* <MovieActorsList movieTitle="Sabrina" /> */}
      <GraphNetwork />
    </div>
  );
}
