from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import (
    MarketOrganization,
    TherapeuticAsset,
    Patent,
    Indication,
    TechnologyPlatform,
)

# ==========================================
# Resolve Service
# ==========================================
# Batch resolvers that turn FK IDs into human-readable data.
# Each function is called from 2+ subrouters — that's why
# this logic lives here instead of in individual subrouters.
#
# Usage in a subrouter:
#   from ..services.resolve_service import resolve_organizations
#   org_map = await resolve_organizations(db, [row.organization_id for row in links])
#   # org_map[5] → {"id": 5, "legal_name": "Pfizer", "ticker_symbol": "PFE", ...}
#
# Callers:
#   resolve_organizations → asset_ownership, patent_assignee, transaction,
#                           licensing_agreement, org_technology_platform (6 subrouters)
#   resolve_assets        → patent_claim, asset_ownership, transaction,
#                           licensing_agreement, development_pipeline,
#                           regulatory_approval, asset_technology_platform (7 subrouters)
#   resolve_patents       → patent_claim, patent_assignee, transaction,
#                           licensing_agreement (4 subrouters)
#   resolve_indications   → development_pipeline, regulatory_approval (2 subrouters)
#   resolve_technology_platforms → asset_technology_platform,
#                                  org_technology_platform (2 subrouters)
# ==========================================


async def resolve_organizations(
    db: AsyncSession, org_ids: list[int]
) -> dict[int, dict]:
    """
    Batch resolve organization IDs to human-readable data.

    One query instead of N. Returns a dict keyed by org ID.
    Called by 6 subrouters that have organization_id as a FK.
    """
    if not org_ids:
        return {}

    # Deduplicate IDs to avoid redundant rows
    unique_ids = list(set(org_ids))

    result = await db.execute(
        select(MarketOrganization).where(
            MarketOrganization.id.in_(unique_ids)
        )
    )
    orgs = result.scalars().all()

    return {
        org.id: {
            "id": org.id,
            "legal_name": org.legal_name,
            "ticker_symbol": org.ticker_symbol,
            "org_type": org.org_type,
            "status": org.status,
        }
        for org in orgs
    }


async def resolve_assets(
    db: AsyncSession, asset_ids: list[int]
) -> dict[int, dict]:
    """
    Batch resolve asset IDs to human-readable data.

    One query instead of N. Returns a dict keyed by asset ID.
    Called by 7 subrouters that have asset_id as a FK.
    """
    if not asset_ids:
        return {}

    unique_ids = list(set(asset_ids))

    result = await db.execute(
        select(TherapeuticAsset).where(
            TherapeuticAsset.id.in_(unique_ids)
        )
    )
    assets = result.scalars().all()

    return {
        asset.id: {
            "id": asset.id,
            "uid": asset.uid,
            "name": asset.name,
            "asset_type": asset.asset_type,
        }
        for asset in assets
    }


async def resolve_patents(
    db: AsyncSession, patent_ids: list[int]
) -> dict[int, dict]:
    """
    Batch resolve patent IDs to human-readable data.

    One query instead of N. Returns a dict keyed by patent ID.
    Called by 4 subrouters that have patent_id as a FK.
    """
    if not patent_ids:
        return {}

    unique_ids = list(set(patent_ids))

    result = await db.execute(
        select(Patent).where(
            Patent.id.in_(unique_ids)
        )
    )
    patents = result.scalars().all()

    return {
        p.id: {
            "id": p.id,
            "patent_number": p.patent_number,
            "title": p.title,
            "status": p.status,
            "jurisdiction": p.jurisdiction,
        }
        for p in patents
    }


async def resolve_indications(
    db: AsyncSession, indication_ids: list[int]
) -> dict[int, dict]:
    """
    Batch resolve indication IDs to human-readable data.

    One query instead of N. Returns a dict keyed by indication ID.
    Called by 2 subrouters: development_pipeline, regulatory_approval.
    """
    if not indication_ids:
        return {}

    unique_ids = list(set(indication_ids))

    result = await db.execute(
        select(Indication).where(
            Indication.id.in_(unique_ids)
        )
    )
    indications = result.scalars().all()

    return {
        ind.id: {
            "id": ind.id,
            "name": ind.name,
            "icd_10_code": ind.icd_10_code,
        }
        for ind in indications
    }


async def resolve_technology_platforms(
    db: AsyncSession, platform_ids: list[int]
) -> dict[int, dict]:
    """
    Batch resolve technology platform IDs to human-readable data.

    One query instead of N. Returns a dict keyed by platform ID.
    Called by 2 subrouters: asset_technology_platform, org_technology_platform.
    """
    if not platform_ids:
        return {}

    unique_ids = list(set(platform_ids))

    result = await db.execute(
        select(TechnologyPlatform).where(
            TechnologyPlatform.id.in_(unique_ids)
        )
    )
    platforms = result.scalars().all()

    return {
        p.id: {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "readiness_level": p.readiness_level,
        }
        for p in platforms
    }
