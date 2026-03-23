"""seed initial admin user

Revision ID: 20260323_0001
Revises: 
Create Date: 2026-03-23 02:37:00
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20260323_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ADMIN_EMAIL = "admin@shoestore.local"
ADMIN_PASSWORD_HASH = "$2b$12$CSmrtBTEvScv3KWXycpXv.TTrJ4pR89r4UoBTgxlSWR1Cgk3NOaZi"


def upgrade() -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'users'
            ) THEN
                INSERT INTO users (first_name, last_name, middle_name, email, password_hash, role, created_at, updated_at)
                SELECT
                    'System',
                    'Administrator',
                    NULL,
                    '{ADMIN_EMAIL}',
                    '{ADMIN_PASSWORD_HASH}',
                    'admin',
                    NOW(),
                    NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM users WHERE email = '{ADMIN_EMAIL}'
                );
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'users'
            ) THEN
                DELETE FROM users WHERE email = '{ADMIN_EMAIL}';
            END IF;
        END $$;
        """
    )
