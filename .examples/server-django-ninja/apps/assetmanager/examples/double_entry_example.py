from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import uuid

from ..models import (
    Entity, FundingRound, Security, Stakeholder, SecurityStock, 
    SecurityTransaction, CashTransaction
)

def generate_transaction_reference():
    """Generate a unique transaction reference"""
    return str(uuid.uuid4())[:8].upper()

def record_security_transaction(stakeholder, funding_round, security, type, units, transaction_date, notes=""):
    """
    Record a security transaction with matching debit and credit entries.
    For issuance/receiving: debit stakeholder, credit issuer
    For transfer out: credit stakeholder, debit receiver
    """
    ref = generate_transaction_reference()
    
    # For issuance, we debit the stakeholder (they receive) and credit the issuer (fund)
    if type in [SecurityTransaction.SecurityTransactionTypes.ISSUANCE, 
                SecurityTransaction.SecurityTransactionTypes.GRANT]:
        # Debit entry (stakeholder receives shares)
        SecurityTransaction.objects.create(
            stakeholder=stakeholder,
            funding_round=funding_round,
            security=security,
            transaction_reference=ref,
            type=type,
            units_debit=units,
            units_credit=0,
            transaction_date=transaction_date,
            notes=notes
        )
        
        # Credit entry (issuer gives shares)
        SecurityTransaction.objects.create(
            stakeholder=Stakeholder.objects.get(entity=funding_round.entity),
            funding_round=funding_round,
            security=security,
            transaction_reference=ref,
            type=type,
            units_debit=0,
            units_credit=units,
            transaction_date=transaction_date,
            notes=notes
        )

def record_cash_transaction(stakeholder, funding_round, type, amount, transaction_date, security=None, notes=""):
    """
    Record a cash transaction with matching debit and credit entries.
    For cash in: debit fund, credit investor
    For cash out: credit fund, debit investment
    """
    ref = generate_transaction_reference()
    
    if type == CashTransaction.CashTransactionTypes.CASH_IN:
        # Debit entry (fund receives cash)
        CashTransaction.objects.create(
            stakeholder=Stakeholder.objects.get(entity=funding_round.entity),
            funding_round=funding_round,
            security=security,
            transaction_reference=ref,
            type=type,
            amount_debit=amount,
            amount_credit=0,
            transaction_date=transaction_date,
            notes=notes
        )
        
        # Credit entry (investor gives cash)
        CashTransaction.objects.create(
            stakeholder=stakeholder,
            funding_round=funding_round,
            security=security,
            transaction_reference=ref,
            type=type,
            amount_debit=0,
            amount_credit=amount,
            transaction_date=transaction_date,
            notes=notes
        )
    
    elif type == CashTransaction.CashTransactionTypes.CASH_OUT:
        # Credit entry (fund gives cash)
        CashTransaction.objects.create(
            stakeholder=Stakeholder.objects.get(entity=funding_round.entity),
            funding_round=funding_round,
            security=security,
            transaction_reference=ref,
            type=type,
            amount_debit=0,
            amount_credit=amount,
            transaction_date=transaction_date,
            notes=notes
        )
        
        # Debit entry (investment receives cash)
        CashTransaction.objects.create(
            stakeholder=stakeholder,
            funding_round=funding_round,
            security=security,
            transaction_reference=ref,
            type=type,
            amount_debit=amount,
            amount_credit=0,
            transaction_date=transaction_date,
            notes=notes
        )

def create_double_entry_example():
    """Example showing double-entry transactions for a simple investment scenario"""
    
    # 1. Create fund entity
    fund = Entity.objects.create(
        name="Example Fund",
        entity_type=Entity.EntityTypes.FUND,
        current_valuation=Decimal('1000000.00'),
        cash_balance=0
    )

    # Create fund stakeholder (for double-entry purposes)
    fund_stakeholder = Stakeholder.objects.create(
        name="Example Fund",
        type=Stakeholder.StakeholderTypes.ENTITY,
        entity=fund
    )

    # 2. Create funding round
    round = FundingRound.objects.create(
        entity=fund,
        name="Round 1",
        round_type=FundingRound.RoundTypes.PRIVATE,
        target_amount=Decimal('1000000.00'),
        date=date.today()
    )

    # 3. Create security
    security = Security.objects.create(
        funding_round=round,
        type=Security.SecurityTypes.COMMON,
        name="Common Stock",
        price=Decimal('10.00')
    )
    SecurityStock.objects.create(
        security=security,
        is_preferred=False
    )

    # 4. Create investor
    investor = Stakeholder.objects.create(
        name="Example Investor",
        type=Stakeholder.StakeholderTypes.LIMITED_PARTNER,
        entity=fund
    )

    # 5. Record investment
    # Investor buys 1000 shares at $10 each
    transaction_date = date.today()
    
    # Record cash transaction ($10,000 investment)
    record_cash_transaction(
        stakeholder=investor,
        funding_round=round,
        type=CashTransaction.CashTransactionTypes.CASH_IN,
        amount=Decimal('10000.00'),
        transaction_date=transaction_date,
        security=security,
        notes="Initial investment"
    )

    # Record security transaction (1000 shares)
    record_security_transaction(
        stakeholder=investor,
        funding_round=round,
        security=security,
        type=SecurityTransaction.SecurityTransactionTypes.ISSUANCE,
        units=Decimal('1000'),
        transaction_date=transaction_date,
        notes="Share issuance for initial investment"
    )

    # 6. Make an investment in a portfolio company
    portfolio_company = Entity.objects.create(
        name="Portfolio Co",
        entity_type=Entity.EntityTypes.COMPANY,
        parent=fund
    )

    portfolio_stakeholder = Stakeholder.objects.create(
        name="Portfolio Co",
        type=Stakeholder.StakeholderTypes.ENTITY,
        entity=portfolio_company
    )

    # Record $5000 investment in portfolio company
    record_cash_transaction(
        stakeholder=portfolio_stakeholder,
        funding_round=round,
        type=CashTransaction.CashTransactionTypes.CASH_OUT,
        amount=Decimal('5000.00'),
        transaction_date=transaction_date,
        notes="Investment in Portfolio Co"
    )

    return {
        'fund': fund,
        'round': round,
        'security': security,
        'investor': investor,
        'portfolio_company': portfolio_company
    }

if __name__ == "__main__":
    setup = create_double_entry_example() 