"""
Extract KCET cutoff data from KEA PDF files and write to Supabase PostgreSQL.

Usage:
  python extract_cutoffs.py --file "kcet_2024_round3.pdf" --year 2024 --round 3
"""

import os
import sys
import logging
from datetime import datetime

import click
import pdfplumber
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from rich.console import Console
from rich.progress import Progress

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

console = Console()

# Setup logging
os.makedirs(os.path.join(os.path.dirname(__file__), 'logs'), exist_ok=True)
logging.basicConfig(
    filename=os.path.join(os.path.dirname(__file__), 'logs', 'extract_errors.log'),
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s',
)

# Category column mapping for standard KEA PDF format
CATEGORY_COLUMNS = [
    ('GM', 'open', 'close'),
    ('SC', 'open', 'close'),
    ('ST', 'open', 'close'),
    ('Cat1', 'open', 'close'),
    ('2A', 'open', 'close'),
    ('2B', 'open', 'close'),
    ('3A', 'open', 'close'),
    ('3B', 'open', 'close'),
]


def clean_rank(value: str) -> int | None:
    """Clean a rank value from PDF cell."""
    if not value:
        return None
    value = value.strip().replace(',', '').replace(' ', '')
    if value in ('—', '-', '0', '', 'NA', 'N/A', '--'):
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def get_db_connection():
    """Create database connection from env."""
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        console.print('[red]ERROR: DATABASE_URL not set in .env[/red]')
        sys.exit(1)
    return psycopg2.connect(db_url)


def ensure_college(cursor, code: str, name: str) -> int:
    """Ensure college exists and return its ID."""
    cursor.execute(
        """INSERT INTO colleges (code, name, district, type)
           VALUES (%s, %s, 'Unknown', 'private')
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
           RETURNING id""",
        (code.strip(), name.strip()),
    )
    return cursor.fetchone()[0]


def ensure_branch(cursor, code: str, name: str) -> int:
    """Ensure branch exists and return its ID."""
    cursor.execute(
        """INSERT INTO branches (code, name, stream)
           VALUES (%s, %s, 'engineering')
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
           RETURNING id""",
        (code.strip(), name.strip()),
    )
    return cursor.fetchone()[0]


@click.command()
@click.option('--file', required=True, help='Path to KEA cutoff PDF')
@click.option('--year', required=True, type=int, help='Year of the cutoff data')
@click.option('--round', 'round_num', required=True, type=int, help='Counselling round (1, 2, or 3)')
def extract_cutoffs(file: str, year: int, round_num: int):
    """Parse KEA cutoff PDFs and write to database."""
    if not os.path.exists(file):
        console.print(f'[red]File not found: {file}[/red]')
        sys.exit(1)

    if round_num not in (1, 2, 3):
        console.print('[red]Round must be 1, 2, or 3[/red]')
        sys.exit(1)

    console.print(f'[bold]Extracting cutoffs from:[/bold] {file}')
    console.print(f'[bold]Year:[/bold] {year}  [bold]Round:[/bold] {round_num}')

    conn = get_db_connection()
    cursor = conn.cursor()

    total_inserted = 0
    errors = 0

    try:
        with pdfplumber.open(file) as pdf:
            total_pages = len(pdf.pages)
            console.print(f'[bold]Total pages:[/bold] {total_pages}')

            with Progress() as progress:
                task = progress.add_task('Processing pages...', total=total_pages)

                for page_num, page in enumerate(pdf.pages, 1):
                    tables = page.extract_tables()

                    for table in tables:
                        if not table or len(table) < 2:
                            continue

                        for row in table[1:]:  # Skip header
                            if not row or len(row) < 6:
                                continue

                            try:
                                # Parse college and branch info
                                # Typical format: [Sl, College Code, College Name, Branch Code, Branch Name, ...]
                                col_code = str(row[1] or '').strip()
                                col_name = str(row[2] or '').strip()
                                branch_code = str(row[3] or '').strip()
                                branch_name = str(row[4] or '').strip()

                                if not col_code or not branch_code:
                                    continue

                                college_id = ensure_college(cursor, col_code, col_name)
                                branch_id = ensure_branch(cursor, branch_code, branch_name)

                                # Parse category columns (pairs of open/close)
                                col_idx = 5  # Start after branch name
                                for cat_code, _, _ in CATEGORY_COLUMNS:
                                    if col_idx + 1 >= len(row):
                                        break

                                    opening = clean_rank(str(row[col_idx] or ''))
                                    closing = clean_rank(str(row[col_idx + 1] or ''))
                                    col_idx += 2

                                    if closing is None:
                                        continue

                                    cursor.execute(
                                        """INSERT INTO cutoffs
                                           (college_id, branch_id, year, round,
                                            vertical_category, horizontal_flags,
                                            opening_rank, closing_rank)
                                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                           ON CONFLICT (college_id, branch_id, year, round,
                                                        vertical_category, horizontal_flags)
                                           DO UPDATE SET
                                             opening_rank = EXCLUDED.opening_rank,
                                             closing_rank = EXCLUDED.closing_rank""",
                                        (college_id, branch_id, year, round_num,
                                         cat_code, '{}', opening, closing),
                                    )
                                    total_inserted += 1

                            except Exception as e:
                                errors += 1
                                logging.error(
                                    f'Page {page_num}, row error: {e}\n  Row: {row}'
                                )
                                continue

                    progress.update(task, advance=1)
                    conn.commit()

        conn.commit()
        console.print(f'\n[green]✓ Done![/green]')
        console.print(f'  Inserted/updated: {total_inserted} rows')
        console.print(f'  Errors: {errors}')

    except Exception as e:
        console.print(f'[red]Fatal error: {e}[/red]')
        logging.error(f'Fatal: {e}')
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    extract_cutoffs()
