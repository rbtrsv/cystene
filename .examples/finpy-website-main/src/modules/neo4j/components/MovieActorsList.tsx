'use client';

import React, { useState, useEffect } from 'react';
import { useNeo4j } from '../Neo4jContext';

interface Props {
  movieTitle: string;
}

function MovieActorsList({ movieTitle }: Props) {
  const driver = useNeo4j();
  const [actors, setActors] = useState<string[]>([]);

  useEffect(() => {
    const fetchActors = async () => {
      const session = driver.session();
      try {
        const query = `
          MATCH (p:Person)-[:ACTED_IN]->(m:Movie {title: $title})
          RETURN p.name AS actorName
        `;
        const result = await session.run(query, { title: movieTitle });
        const actorNames = result.records.map((record) =>
          record.get('actorName')
        );
        setActors(actorNames);
      } catch (error) {
        console.error('Error fetching actors:', error);
      } finally {
        session.close();
      }
    };

    fetchActors();
  }, [driver, movieTitle]);

  return (
    <div>
      <h2>Actors in &quot;{movieTitle}&quot;:</h2>
      <ul>
        {actors.map((actor) => (
          <li key={actor}>{actor}</li>
        ))}
      </ul>
    </div>
  );
}

export default MovieActorsList;
