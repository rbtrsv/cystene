from ninja import Router
from .subrouters.auth_subrouter import router as auth_router
from .subrouters.oauth_subrouter import router as oauth_router
from .subrouters.organizations_subrouter import router as organizations_router
from .subrouters.organizations_members_subrouter import router as organization_members_router
from .subrouters.subscriptions_subrouter import router as subscriptions_router
from .subrouters.invitations_subrouter import router as invitations_router

router = Router(tags=["Accounts"])

router.add_router("/auth/", auth_router)
router.add_router("/oauth/", oauth_router)
router.add_router("/organizations/", organizations_router)
router.add_router("/organization-members/", organization_members_router)
router.add_router("/subscriptions/", subscriptions_router)
router.add_router("/invitations/", invitations_router)