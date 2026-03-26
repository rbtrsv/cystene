"""Convert size enum fields to integer

Revision ID: f8466907e675
Revises: 84f54c2653b4
Create Date: 2026-03-11 19:36:48.823713

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8466907e675'
down_revision: Union[str, Sequence[str], None] = '84f54c2653b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Enum string → integer pixel/weight conversion maps
TITLE_SIZE_MAP = {"sm": 16, "md": 20, "lg": 24, "xl": 30}
PRODUCT_TITLE_SIZE_MAP = {"xs": 12, "sm": 14, "md": 16, "lg": 18}
WEIGHT_MAP = {"normal": 400, "medium": 500, "semibold": 600, "bold": 700}
PRICE_SIZE_MAP = {"sm": 14, "md": 18, "lg": 20}
BUTTON_SIZE_MAP = {"sm": 12, "md": 14, "lg": 16}

# Column name → conversion map
CONVERSIONS = {
    "title_size": TITLE_SIZE_MAP,
    "product_title_size": PRODUCT_TITLE_SIZE_MAP,
    "product_title_weight": WEIGHT_MAP,
    "price_size": PRICE_SIZE_MAP,
    "button_size": BUTTON_SIZE_MAP,
}


def upgrade() -> None:
    """Upgrade schema.

    Data conversion steps before ALTER TYPE:
    1. Convert enum strings to integer strings using conversion maps
    2. Set any remaining non-numeric values to NULL for safety
    3. ALTER TYPE VARCHAR(50) → Integer with postgresql_using cast
    """
    conn = op.get_bind()

    # Step 1: Convert enum strings → integer strings
    for col, mapping in CONVERSIONS.items():
        for enum_val, int_val in mapping.items():
            conn.execute(
                sa.text(
                    f"UPDATE recommendation_settings "
                    f"SET {col} = :int_val WHERE {col} = :enum_val"
                ),
                {"int_val": str(int_val), "enum_val": enum_val}
            )

    # Step 2: Set any remaining non-numeric values to NULL
    for col in CONVERSIONS:
        conn.execute(
            sa.text(
                f"UPDATE recommendation_settings "
                f"SET {col} = NULL "
                f"WHERE {col} IS NOT NULL AND {col} !~ '^[0-9]+$'"
            )
        )

    # Step 3: ALTER TYPE — safe because all values are numeric strings or NULL
    for col in CONVERSIONS:
        op.alter_column(
            'recommendation_settings', col,
            existing_type=sa.VARCHAR(length=50),
            type_=sa.Integer(),
            existing_nullable=True,
            postgresql_using=f'{col}::integer'
        )


def downgrade() -> None:
    """Downgrade schema."""
    for col in CONVERSIONS:
        op.alter_column(
            'recommendation_settings', col,
            existing_type=sa.Integer(),
            type_=sa.VARCHAR(length=50),
            existing_nullable=True,
            postgresql_using=f'{col}::varchar'
        )
