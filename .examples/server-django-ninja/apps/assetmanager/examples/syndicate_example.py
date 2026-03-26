from django.utils import timezone
from datetime import date
from decimal import Decimal
from ..models import (
    Entity, FundingRound, Security, Stakeholder, SecurityStock,
    EquityTransaction, CashTransaction, Syndicate, SyndicateMember
)

def create_syndicate_example():
    # 1. Create V7 Fund Entity
    v7_fund = Entity.objects.create(
        name="V7 Fund",
        entity_type=Entity.EntityTypes.FUND,
        current_valuation=Decimal('500000.00')  # 500k USD initial valuation
    )

    # 2. Create funding round with 100,000 shares at $5 each
    fund_round = FundingRound.objects.create(
        entity=v7_fund,
        name="Initial Round",
        round_type=FundingRound.RoundTypes.PRIVATE,
        target_amount=Decimal('500000.00'),  # 100,000 * $5
        raised_amount=0,
        date=date.today()
    )

    # 3. Create common stock security
    common_stock = Security.objects.create(
        funding_round=fund_round,
        type=Security.SecurityTypes.COMMON,
        name="V7 Common Stock",
        price=Decimal('5.00')
    )
    SecurityStock.objects.create(
        security=common_stock,
        is_preferred=False
    )

    # 4. Create Blackrock as direct investor
    blackrock = Stakeholder.objects.create(
        name="Blackrock",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=v7_fund
    )

    # 5. Create Syndicate and its members
    syndicate = Syndicate.objects.create(
        name="Seqoia-Pinkspeed Syndicate",
        type=Stakeholder.StakeholderTypes.SYNDICATE,
        entity=v7_fund
    )

    # Create syndicate members
    sequoia = Stakeholder.objects.create(
        name="Sequoia",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=v7_fund
    )

    pinkspeed = Stakeholder.objects.create(
        name="Pinkspeed",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=v7_fund
    )

    # Add members to syndicate with their ownership percentages
    SyndicateMember.objects.create(
        syndicate=syndicate,
        member=sequoia,
        ownership_percentage=Decimal('60.00')  # 60% ownership in syndicate
    )

    SyndicateMember.objects.create(
        syndicate=syndicate,
        member=pinkspeed,
        ownership_percentage=Decimal('40.00')  # 40% ownership in syndicate
    )

    # 6. Record share purchases
    # Blackrock buys 4000 shares
    blackrock_investment = Decimal('20000.00')  # 4000 * $5
    CashTransaction.objects.create(
        stakeholder=blackrock,
        funding_round=fund_round,
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=blackrock_investment,
        transaction_date=date.today()
    )

    EquityTransaction.objects.create(
        stakeholder=blackrock,
        funding_round=fund_round,
        security=common_stock,
        type=EquityTransaction.EquityTransactionTypes.ISSUANCE,
        shares=Decimal('4000'),
        transaction_date=date.today()
    )

    # Syndicate buys 6000 shares
    syndicate_investment = Decimal('30000.00')  # 6000 * $5
    CashTransaction.objects.create(
        stakeholder=syndicate,
        funding_round=fund_round,
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=syndicate_investment,
        transaction_date=date.today()
    )

    EquityTransaction.objects.create(
        stakeholder=syndicate,
        funding_round=fund_round,
        security=common_stock,
        type=EquityTransaction.EquityTransactionTypes.ISSUANCE,
        shares=Decimal('6000'),
        transaction_date=date.today()
    )

    # Update fund's cash balance
    v7_fund.cash_balance = blackrock_investment + syndicate_investment
    v7_fund.save()

    # 7. Create three portfolio companies
    portfolio_companies = []
    for company_name in ["TechStart", "HealthAI", "GreenEnergy"]:
        company = Entity.objects.create(
            name=company_name,
            entity_type=Entity.EntityTypes.COMPANY,
            parent=v7_fund
        )
        portfolio_companies.append(company)

        # Create stakeholder record for the company
        company_stakeholder = Stakeholder.objects.create(
            name=company_name,
            type=Stakeholder.StakeholderTypes.ENTITY,
            entity=company
        )

        # Record investment transaction
        investment_amount = Decimal('15000.00')
        CashTransaction.objects.create(
            stakeholder=company_stakeholder,
            funding_round=fund_round,
            type=CashTransaction.CashTransactionTypes.CASH_OUT,
            amount=investment_amount,
            transaction_date=date.today()
        )

        v7_fund.cash_balance -= investment_amount
        v7_fund.save()

    return {
        'fund': v7_fund,
        'round': fund_round,
        'blackrock': blackrock,
        'syndicate': syndicate,
        'syndicate_members': {
            'sequoia': sequoia,
            'pinkspeed': pinkspeed
        },
        'portfolio_companies': portfolio_companies
    }

if __name__ == "__main__":
    # Run the example
    setup = create_syndicate_example() 