from surrealdb import AsyncSurreal # Changed import
from django.conf import settings


async def get_surreal_connection(): # Added async
    """
    Establish connection to SurrealDB.
    
    Returns:
        AsyncSurreal: A connected SurrealDB client instance # Changed return type hint
    """
    db = AsyncSurreal(settings.SURREAL_DB_URL) # Changed class
    await db.signin({ # Added await
        "username": settings.SURREAL_USERNAME, 
        "password": settings.SURREAL_PASSWORD
    })
    await db.use(settings.SURREAL_NAMESPACE, settings.SURREAL_DATABASE) # Added await
    return db
