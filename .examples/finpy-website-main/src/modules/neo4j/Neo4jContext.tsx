import { createContext, useContext, ReactNode } from 'react';
import neo4j, { Driver } from 'neo4j-driver';

const Neo4jContext = createContext<Driver | null>(null);

interface Neo4jProviderProps {
  children: ReactNode;
}

export const Neo4jProvider: React.FC<Neo4jProviderProps> = ({ children }) => {
  const driver = neo4j.driver(
    'neo4j+s://a6deaac7.databases.neo4j.io',
    neo4j.auth.basic('neo4j', '0qL5ztEj4wcinMAQYm7V1sryyIMzVdn2LLN56CCMqLM')
  );

  return (
    <Neo4jContext.Provider value={driver}>{children}</Neo4jContext.Provider>
  );
};

export const useNeo4j = () => {
  const context = useContext(Neo4jContext);
  if (!context) {
    throw new Error('useNeo4j must be used within a Neo4jProvider');
  }
  return context;
};
