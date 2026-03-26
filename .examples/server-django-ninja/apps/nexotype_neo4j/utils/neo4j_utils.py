from django.conf import settings
from neomodel import adb
import asyncio
from typing import Dict, Any, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def run_async(coro):
    """Run a coroutine in a new event loop"""
    try:
        loop = asyncio.get_running_loop()
        return asyncio.create_task(coro)
    except RuntimeError:
        return asyncio.run(coro)

async def execute_cypher(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Execute a Cypher query against the Neo4j database
    
    Args:
        query: The Cypher query to execute
        params: The parameters for the query
        
    Returns:
        List of records returned by the query
    """
    try:
        results, meta = await adb.cypher_query(query, params or {})
        return results
    except Exception as e:
        logger.error(f"Error executing Cypher query: {str(e)}")
        logger.error(f"Query: {query}")
        logger.error(f"Params: {params}")
        raise

async def paginate_results(query: str, params: Optional[Dict[str, Any]] = None, 
                       page: int = 1, page_size: int = 10) -> Tuple[List[Dict[str, Any]], int]:
    """
    Paginate Cypher query results
    
    Args:
        query: The Cypher query to execute
        params: The parameters for the query
        page: The page number (1-indexed)
        page_size: The number of results per page
        
    Returns:
        Tuple containing the paginated results and total count
    """
    # Calculate skip value for pagination
    skip = (page - 1) * page_size
    
    # Split the query to insert the count query
    lower_query = query.lower()
    if "return" not in lower_query:
        raise ValueError("Query must contain a RETURN clause")
    
    split_index = lower_query.find("return")
    before_return = query[:split_index]
    after_return = query[split_index:]
    
    # Create count query
    count_query = before_return + "RETURN count(*) as total"
    
    # Create paginated query
    paginated_query = query + f" SKIP {skip} LIMIT {page_size}"
    
    # Execute count query
    count_results, _ = await adb.cypher_query(count_query, params)
    total_count = count_results[0][0] if count_results else 0
    
    # Execute paginated query
    results, _ = await adb.cypher_query(paginated_query, params)
    
    return results, total_count

async def create_relationship(from_node_label: str, from_node_id: str, 
                          relationship_type: str, to_node_label: str, 
                          to_node_id: str, properties: Optional[Dict[str, Any]] = None) -> bool:
    """
    Create a relationship between two nodes
    
    Args:
        from_node_label: The label of the from node
        from_node_id: The uid of the from node
        relationship_type: The type of relationship
        to_node_label: The label of the to node
        to_node_id: The uid of the to node
        properties: Properties to set on the relationship
        
    Returns:
        True if successful, False otherwise
    """
    try:
        property_string = ""
        if properties:
            property_parts = [f"r.{k} = ${k}" for k in properties.keys()]
            property_string = "SET " + ", ".join(property_parts)
        
        query = f"""
        MATCH (a:{from_node_label}), (b:{to_node_label})
        WHERE a.uid = $from_id AND b.uid = $to_id
        CREATE (a)-[r:{relationship_type}]->(b)
        {property_string}
        RETURN r
        """
        
        params = {
            "from_id": from_node_id,
            "to_id": to_node_id,
            **(properties or {})
        }
        
        results, _ = await adb.cypher_query(query, params)
        return bool(results)
    except Exception as e:
        logger.error(f"Error creating relationship: {str(e)}")
        return False

async def delete_relationship(from_node_label: str, from_node_id: str, 
                          relationship_type: str, to_node_label: str, 
                          to_node_id: str) -> bool:
    """
    Delete a relationship between two nodes
    
    Args:
        from_node_label: The label of the from node
        from_node_id: The uid of the from node
        relationship_type: The type of relationship
        to_node_label: The label of the to node
        to_node_id: The uid of the to node
        
    Returns:
        True if successful, False otherwise
    """
    try:
        query = f"""
        MATCH (a:{from_node_label})-[r:{relationship_type}]->(b:{to_node_label})
        WHERE a.uid = $from_id AND b.uid = $to_id
        DELETE r
        """
        
        params = {
            "from_id": from_node_id,
            "to_id": to_node_id
        }
        
        await adb.cypher_query(query, params)
        return True
    except Exception as e:
        logger.error(f"Error deleting relationship: {str(e)}")
        return False

async def update_relationship_properties(from_node_label: str, from_node_id: str, 
                                     relationship_type: str, to_node_label: str, 
                                     to_node_id: str, properties: Dict[str, Any]) -> bool:
    """
    Update properties of a relationship
    
    Args:
        from_node_label: The label of the from node
        from_node_id: The uid of the from node
        relationship_type: The type of relationship
        to_node_label: The label of the to node
        to_node_id: The uid of the to node
        properties: Properties to set on the relationship
        
    Returns:
        True if successful, False otherwise
    """
    try:
        property_parts = [f"r.{k} = ${k}" for k in properties.keys()]
        property_string = ", ".join(property_parts)
        
        query = f"""
        MATCH (a:{from_node_label})-[r:{relationship_type}]->(b:{to_node_label})
        WHERE a.uid = $from_id AND b.uid = $to_id
        SET {property_string}
        RETURN r
        """
        
        params = {
            "from_id": from_node_id,
            "to_id": to_node_id,
            **properties
        }
        
        results, _ = await adb.cypher_query(query, params)
        return bool(results)
    except Exception as e:
        logger.error(f"Error updating relationship properties: {str(e)}")
        return False