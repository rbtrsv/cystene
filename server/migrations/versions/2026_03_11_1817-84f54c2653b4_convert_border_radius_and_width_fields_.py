"""Convert border radius and width fields to integer

Revision ID: 84f54c2653b4
Revises: b635dae35a96
Create Date: 2026-03-11 18:17:26.101467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84f54c2653b4'
down_revision: Union[str, Sequence[str], None] = 'b635dae35a96'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Size-to-pixel mapping for widget_padding, gap, card_padding
# These fields stored "sm"/"md"/"lg" strings → convert to pixel integers
SIZE_MAP = {
    'sm': 8,
    'md': 16,
    'lg': 24,
    'xl': 32,
}

# image_aspect stored "square"/"portrait"/"landscape" → convert to aspect_w, aspect_h
ASPECT_MAP = {
    'square':    (1, 1),
    'portrait':  (3, 4),
    'landscape': (16, 9),
}


def upgrade() -> None:
    """Upgrade schema.

    Data conversion steps before ALTER TYPE:
    1. widget_padding, gap, card_padding: "sm"→8, "md"→16, "lg"→24, "xl"→32, numeric strings left as-is
    2. card_border_radius, image_radius, button_radius: strip "px" suffix, cast to int
    3. card_border_width: already numeric strings ("0"/"1"/"2"), no conversion needed
    4. image_aspect → image_aspect_w, image_aspect_h: "square"→(1,1), "portrait"→(3,4), "landscape"→(16,9)
    5. Add card_min_width, card_max_width columns
    """
    conn = op.get_bind()

    # Step 1: Add new columns first
    op.add_column('recommendation_settings', sa.Column('card_min_width', sa.Integer(), nullable=True))
    op.add_column('recommendation_settings', sa.Column('card_max_width', sa.Integer(), nullable=True))
    op.add_column('recommendation_settings', sa.Column('image_aspect_w', sa.Integer(), nullable=True))
    op.add_column('recommendation_settings', sa.Column('image_aspect_h', sa.Integer(), nullable=True))

    # Step 2: Convert image_aspect string → image_aspect_w, image_aspect_h integers
    for aspect_name, (w, h) in ASPECT_MAP.items():
        conn.execute(
            sa.text(
                "UPDATE recommendation_settings "
                "SET image_aspect_w = :w, image_aspect_h = :h "
                "WHERE image_aspect = :aspect"
            ),
            {"w": w, "h": h, "aspect": aspect_name}
        )

    # Step 3: Convert size strings to pixel integers for widget_padding, gap, card_padding
    for col in ('widget_padding', 'gap', 'card_padding'):
        for size_name, px_value in SIZE_MAP.items():
            conn.execute(
                sa.text(
                    f"UPDATE recommendation_settings "
                    f"SET {col} = :px WHERE {col} = :size"
                ),
                {"px": str(px_value), "size": size_name}
            )

    # Step 4: Strip "px" suffix from border/radius fields (e.g. "8px" → "8")
    for col in ('card_border_radius', 'image_radius', 'button_radius'):
        conn.execute(
            sa.text(
                f"UPDATE recommendation_settings "
                f"SET {col} = REPLACE({col}, 'px', '') "
                f"WHERE {col} LIKE '%px'"
            )
        )

    # Step 5: Set NULL values to prevent cast errors (NULL is fine for Integer)
    # Set any remaining non-numeric values to NULL for safety
    for col in ('widget_padding', 'gap', 'card_padding', 'card_border_radius',
                'card_border_width', 'image_radius', 'button_radius'):
        conn.execute(
            sa.text(
                f"UPDATE recommendation_settings "
                f"SET {col} = NULL "
                f"WHERE {col} IS NOT NULL AND {col} !~ '^[0-9]+$'"
            )
        )

    # Step 6: ALTER TYPE — now safe because all values are numeric strings or NULL
    # PostgreSQL can cast numeric strings to integer via USING
    for col in ('widget_padding', 'gap', 'card_border_radius', 'card_border_width',
                'card_padding', 'image_radius', 'button_radius'):
        op.alter_column(
            'recommendation_settings', col,
            existing_type=sa.VARCHAR(length=50),
            type_=sa.Integer(),
            existing_nullable=True,
            postgresql_using=f'{col}::integer'
        )

    # Step 7: Drop the old image_aspect column (replaced by image_aspect_w, image_aspect_h)
    op.drop_column('recommendation_settings', 'image_aspect')


def downgrade() -> None:
    """Downgrade schema."""
    # Restore image_aspect column
    op.add_column('recommendation_settings', sa.Column('image_aspect', sa.VARCHAR(length=50), autoincrement=False, nullable=True))

    # Revert Integer → VARCHAR for all 7 fields
    for col in ('button_radius', 'image_radius', 'card_padding', 'card_border_width',
                'card_border_radius', 'gap', 'widget_padding'):
        op.alter_column(
            'recommendation_settings', col,
            existing_type=sa.Integer(),
            type_=sa.VARCHAR(length=50),
            existing_nullable=True,
            postgresql_using=f'{col}::varchar'
        )

    # Drop new columns
    op.drop_column('recommendation_settings', 'image_aspect_h')
    op.drop_column('recommendation_settings', 'image_aspect_w')
    op.drop_column('recommendation_settings', 'card_max_width')
    op.drop_column('recommendation_settings', 'card_min_width')
