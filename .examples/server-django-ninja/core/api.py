from ninja import NinjaAPI
from apps.main.router import router as main_router
from apps.accounts.router import router as accounts_router
from apps.assetmanager.router import router as assetmanager_router

api = NinjaAPI(title='Finpy API')

api.add_router('', main_router)
api.add_router('/accounts/', accounts_router)
api.add_router('/assetmanager/', assetmanager_router)
