from ninja import Router

from .subrouters.genes_subrouter import router as genes_router
from .subrouters.peptides_subrouter import router as peptides_router
from .subrouters.proteins_subrouter import router as proteins_router
from .subrouters.pathways_subrouter import router as pathways_router
from .subrouters.diseases_subrouter import router as diseases_router

# Main router
router = Router(tags=["Nexotype SurrealDB"])

# Add subrouters
router.add_router("/genes/", genes_router)
router.add_router("/peptides/", peptides_router)
router.add_router("/proteins/", proteins_router)
router.add_router("/pathways/", pathways_router)
router.add_router("/diseases/", diseases_router)