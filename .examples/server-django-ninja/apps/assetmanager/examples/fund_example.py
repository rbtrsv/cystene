from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
from ..models import (
    Entity, FundingRound, Security, Stakeholder, SecurityStock, 
    SecurityConvertible, SecurityOption, SecurityBond,
    EquityTransaction, CashTransaction, EntityInvitation
)

def create_v7_fund_example():
    # 1. Create V7 Capital Fund Entity
    v7_capital = Entity.objects.create(
        name="V7 Capital",
        entity_type=Entity.EntityTypes.FUND,
        current_valuation=Decimal('2000000.00'),  # 2M USD
        cash_balance=0
    )

    # 2. Create Fund 1 Funding Round
    fund_1_round = FundingRound.objects.create(
        entity=v7_capital,
        name="Fund 1",
        round_type=FundingRound.RoundTypes.PRIVATE,
        target_amount=Decimal('2000000.00'),
        raised_amount=0,
        date=date.today(),
        pre_money_valuation=Decimal('2000000.00')
    )

    # 3. Create Securities
    # Common Stock
    common_stock = Security.objects.create(
        funding_round=fund_1_round,
        type=Security.SecurityTypes.COMMON,
        name="V7 Common Stock",
        price=Decimal('0.50')
    )
    SecurityStock.objects.create(
        security=common_stock,
        is_preferred=False
    )

    # Convertible Stock
    convertible_stock = Security.objects.create(
        funding_round=fund_1_round,
        type=Security.SecurityTypes.CONVERTIBLE,
        name="V7 Convertible Stock",
        price=Decimal('0.50')
    )
    SecurityConvertible.objects.create(
        security=convertible_stock,
        interest_rate=Decimal('8.00'),
        maturity_date=date.today() + timedelta(days=365*5),
        valuation_cap=Decimal('5000000.00')
    )

    # Bond
    bond = Security.objects.create(
        funding_round=fund_1_round,
        type=Security.SecurityTypes.BOND,
        name="V7 Bond",
        price=Decimal('1000.00')  # $1000 per bond
    )
    SecurityBond.objects.create(
        security=bond,
        face_value=Decimal('1000.00'),
        coupon_rate=Decimal('7.00'),
        maturity_date=date.today() + timedelta(days=365*3),
        interest_frequency=SecurityBond.InterestFrequency.SEMI_ANNUAL
    )

    # 4. Create Stakeholders
    pinkrock = Stakeholder.objects.create(
        name="PinkRock Investments",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=v7_capital
    )

    emag = Stakeholder.objects.create(
        name="eMag Ventures",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=v7_capital
    )

    # 5. Create Initial Investments (Cash In and Equity Transactions)
    # PinkRock Investment
    CashTransaction.objects.create(
        stakeholder=pinkrock,
        funding_round=fund_1_round,
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=Decimal('700000.00'),
        transaction_date=date.today()
    )
    EquityTransaction.objects.create(
        stakeholder=pinkrock,
        funding_round=fund_1_round,
        security=common_stock,
        type=EquityTransaction.EquityTransactionTypes.ISSUANCE,
        shares=Decimal('1400000'),  # 700k / 0.50 per share
        transaction_date=date.today()
    )

    # eMag Investment
    CashTransaction.objects.create(
        stakeholder=emag,
        funding_round=fund_1_round,
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=Decimal('300000.00'),
        transaction_date=date.today()
    )
    EquityTransaction.objects.create(
        stakeholder=emag,
        funding_round=fund_1_round,
        security=common_stock,
        type=EquityTransaction.EquityTransactionTypes.ISSUANCE,
        shares=Decimal('600000'),  # 300k / 0.50 per share
        transaction_date=date.today()
    )

    # Update fund's cash balance
    v7_capital.cash_balance = Decimal('1000000.00')  # 700k + 300k
    v7_capital.save()

    # 6. Create Robert's ESOP
    robert = Stakeholder.objects.create(
        name="Robert",
        type=Stakeholder.StakeholderTypes.EMPLOYEE,
        entity=v7_capital
    )

    esop = Security.objects.create(
        funding_round=fund_1_round,
        type=Security.SecurityTypes.OPTION,
        name="V7 ESOP",
        price=Decimal('0.50')
    )

    SecurityOption.objects.create(
        security=esop,
        expiration_date=date.today() + timedelta(days=365*7),
        exercise_price=Decimal('0.50'),
        total_shares=Decimal('20000'),
        vesting_start=date.today(),
        vesting_months=60,  # 5 years
        cliff_months=12,
        is_esop=True
    )

    EquityTransaction.objects.create(
        stakeholder=robert,
        funding_round=fund_1_round,
        security=esop,
        type=EquityTransaction.EquityTransactionTypes.GRANT,
        shares=Decimal('20000'),
        transaction_date=date.today()
    )

    # 7. Create Portfolio Companies
    zaganu = Entity.objects.create(
        name="Zaganu Brewing",
        entity_type=Entity.EntityTypes.COMPANY,
        parent=v7_capital
    )

    performant = Entity.objects.create(
        name="2Performant",
        entity_type=Entity.EntityTypes.COMPANY,
        parent=v7_capital
    )

    # 8. Create Investment Transactions
    # Zaganu Investment
    CashTransaction.objects.create(
        stakeholder=Stakeholder.objects.create(
            name="Zaganu Brewing",
            type=Stakeholder.StakeholderTypes.ENTITY,
            entity=zaganu
        ),
        funding_round=fund_1_round,
        type=CashTransaction.CashTransactionTypes.CASH_OUT,
        amount=Decimal('50000.00'),
        transaction_date=date.today()
    )

    # 2Performant Investment
    CashTransaction.objects.create(
        stakeholder=Stakeholder.objects.create(
            name="2Performant",
            type=Stakeholder.StakeholderTypes.ENTITY,
            entity=performant
        ),
        funding_round=fund_1_round,
        type=CashTransaction.CashTransactionTypes.CASH_OUT,
        amount=Decimal('50000.00'),
        transaction_date=date.today()
    )

    # Update fund's cash balance
    v7_capital.cash_balance -= Decimal('100000.00')  # Subtract both investments
    v7_capital.save()

    return {
        'fund': v7_capital,
        'round': fund_1_round,
        'stakeholders': {
            'pinkrock': pinkrock,
            'emag': emag,
            'robert': robert
        },
        'portfolio': {
            'zaganu': zaganu,
            'performant': performant
        }
    }

def create_secondary_and_exit_example(initial_data):
    # 9. Create Softly stakeholder for secondary sale
    softly = Stakeholder.objects.create(
        name="Softly",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=initial_data['fund']
    )

    # Transfer 50% of PinkRock's shares to Softly
    pinkrock_shares = EquityTransaction.objects.filter(
        stakeholder=initial_data['stakeholders']['pinkrock']
    ).first()
    
    transfer_shares = pinkrock_shares.shares / 2

    EquityTransaction.objects.create(
        stakeholder=initial_data['stakeholders']['pinkrock'],
        funding_round=initial_data['round'],
        security=pinkrock_shares.security,
        type=EquityTransaction.EquityTransactionTypes.TRANSFER,
        shares=-transfer_shares,  # Negative for transfer out
        transaction_date=date.today()
    )

    EquityTransaction.objects.create(
        stakeholder=softly,
        funding_round=initial_data['round'],
        security=pinkrock_shares.security,
        type=EquityTransaction.EquityTransactionTypes.TRANSFER,
        shares=transfer_shares,  # Positive for transfer in
        transaction_date=date.today()
    )

    # 10. 2Performant Exit
    exit_cash = Decimal('200000.00')
    initial_data['fund'].cash_balance += exit_cash
    initial_data['fund'].save()

    # Record the exit transaction
    CashTransaction.objects.create(
        stakeholder=Stakeholder.objects.get(entity=initial_data['portfolio']['performant']),
        funding_round=initial_data['round'],
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=exit_cash,
        transaction_date=date.today()
    )

    # 11. Distribution to stakeholders
    distribution_amount = Decimal('100000.00')
    for stakeholder in [initial_data['stakeholders']['pinkrock'], 
                       initial_data['stakeholders']['emag'], 
                       softly]:
        CashTransaction.objects.create(
            stakeholder=stakeholder,
            funding_round=initial_data['round'],
            type=CashTransaction.CashTransactionTypes.DISTRIBUTION,
            amount=distribution_amount / 3,  # Equal distribution
            transaction_date=date.today()
        )

    initial_data['fund'].cash_balance -= distribution_amount
    initial_data['fund'].save()

    return softly

def create_convertible_note_example(initial_data):
    # 12. Create W3Invest stakeholder and convertible note investment
    w3invest = Stakeholder.objects.create(
        name="W3Invest",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=initial_data['fund']
    )

    # Create convertible note security
    convertible = Security.objects.create(
        funding_round=initial_data['round'],
        type=Security.SecurityTypes.CONVERTIBLE,
        name="W3Invest Convertible Note",
        price=Decimal('1.00')
    )

    SecurityConvertible.objects.create(
        security=convertible,
        interest_rate=Decimal('8.00'),
        maturity_date=date.today() + timedelta(days=365*2),
        valuation_cap=Decimal('5000000.00')
    )

    # Record cash investment
    CashTransaction.objects.create(
        stakeholder=w3invest,
        funding_round=initial_data['round'],
        security=convertible,
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=Decimal('100000.00'),
        transaction_date=date.today()
    )

    initial_data['fund'].cash_balance += Decimal('100000.00')
    initial_data['fund'].save()

    # After 2 years, convert 50% to shares
    conversion_shares = Decimal('100000')  # Example number of shares
    
    EquityTransaction.objects.create(
        stakeholder=w3invest,
        funding_round=initial_data['round'],
        security=convertible,
        type=EquityTransaction.EquityTransactionTypes.CONVERSION,
        shares=conversion_shares / 2,  # Converting 50%
        transaction_date=date.today() + timedelta(days=365*2)
    )

    return w3invest

def setup_portfolio_reporting(initial_data):
    # 13. Create invitations for portfolio companies to report financials
    for company in [initial_data['portfolio']['zaganu'], 
                   initial_data['portfolio']['performant']]:
        EntityInvitation.objects.create(
            inviting_entity=initial_data['fund'],
            email=f"finance@{company.name.lower().replace(' ', '')}.com",
            access_type=EntityInvitation.AccessTypes.FINANCIALS
        )

if __name__ == "__main__":
    # Run the example
    initial_setup = create_v7_fund_example()
    softly = create_secondary_and_exit_example(initial_setup)
    w3invest = create_convertible_note_example(initial_setup)
    setup_portfolio_reporting(initial_setup) 