from fastapi import APIRouter
from .subrouters.auth_subrouter import router as auth_router
from .subrouters.organizations_subrouter import router as organizations_router
from .subrouters.organization_invitations_subrouter import router as invitations_router
from .subrouters.organization_members_subrouter import router as members_router
from .subrouters.oauth_subrouter import router as oauth_router
from .subrouters.subscriptions_subrouter import router as subscriptions_router

router = APIRouter(prefix="/accounts")

# Include all account-related subrouters
router.include_router(auth_router, prefix="/auth")
router.include_router(oauth_router, prefix="/oauth")
router.include_router(organizations_router, prefix="/organizations")
router.include_router(members_router, prefix="/organizations")
router.include_router(invitations_router, prefix="/invitations")
router.include_router(subscriptions_router, prefix="/subscriptions")