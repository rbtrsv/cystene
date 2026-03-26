from ninja import Router
from .subrouters.entities_subrouter import router as entities_router
from .subrouters.entities_invitations_subrouter import router as entity_invitations_router

router = Router(tags=["Asset Manager"])

router.add_router("/entities/", entities_router)
router.add_router("/entity-invitations/", entity_invitations_router) 