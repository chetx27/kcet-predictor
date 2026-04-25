"""
Extract college information from KEA brochure PDF.

Usage:
  python extract_colleges.py --file "kea_college_brochure.pdf"
"""

import os
import sys

import click
import pdfplumber
import psycopg2
from dotenv import load_dotenv
from rich.console import Console
from rich.progress import Progress

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

console = Console()

# Common type detection keywords
TYPE_KEYWORDS = {
    'government': ['government', 'govt', 'gvt'],
    'aided': ['aided', 'grant-in-aid', 'grant in aid'],
    'private': ['private', 'unaided', 'self-financing'],
}


def detect_college_type(name: str) -> str:
    """Detect college type from name string."""
    lower = name.lower()
    for college_type, keywords in TYPE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return college_type
    return 'private'


def get_db_connection():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        console.print('[red]ERROR: DATABASE_URL not set in .env[/red]')
        sys.exit(1)
    return psycopg2.connect(db_url)


@click.command()
@click.option('--file', required=True, help='Path to KEA college brochure PDF')
def extract_colleges(file: str):
    """Extract college and branch data from KEA brochure."""
    if not os.path.exists(file):
        console.print(f'[red]File not found: {file}[/red]')
        sys.exit(1)

    console.print(f'[bold]Extracting colleges from:[/bold] {file}')

    conn = get_db_connection()
    cursor = conn.cursor()

    colleges_added = 0
    branches_added = 0

    try:
        with pdfplumber.open(file) as pdf:
            total_pages = len(pdf.pages)
            console.print(f'[bold]Total pages:[/bold] {total_pages}')

            with Progress() as progress:
                task = progress.add_task('Processing...', total=total_pages)

                for page in pdf.pages:
                    tables = page.extract_tables()

                    for table in tables:
                        if not table or len(table) < 2:
                            continue

                        for row in table[1:]:
                            if not row or len(row) < 4:
                                continue

                            try:
                                col_code = str(row[0] or '').strip()
                                col_name = str(row[1] or '').strip()

                                if not col_code or not col_name:
                                    continue

                                # Detect district if available
                                district = str(row[2] or 'Unknown').strip() if len(row) > 2 else 'Unknown'
                                college_type = detect_college_type(col_name)

                                # Upsert college
                                cursor.execute(
                                    """INSERT INTO colleges (code, name, district, type)
                                       VALUES (%s, %s, %s, %s)
                                       ON CONFLICT (code) DO UPDATE SET
                                         name = EXCLUDED.name,
                                         district = EXCLUDED.district,
                                         type = EXCLUDED.type
                                       RETURNING id""",
                                    (col_code, col_name, district, college_type),
                                )
                                college_id = cursor.fetchone()[0]
                                colleges_added += 1

                                # Parse branches if available
                                if len(row) > 4:
                                    branch_code = str(row[3] or '').strip()
                                    branch_name = str(row[4] or '').strip()
                                    seats = None
                                    if len(row) > 5:
                                        try:
                                            seats = int(float(str(row[5]).strip()))
                                        except (ValueError, TypeError):
                                            seats = None

                                    if branch_code and branch_name:
                                        cursor.execute(
                                            """INSERT INTO branches (code, name, stream)
                                               VALUES (%s, %s, 'engineering')
                                               ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                                               RETURNING id""",
                                            (branch_code, branch_name),
                                        )
                                        branch_id = cursor.fetchone()[0]
                                        branches_added += 1

                                        cursor.execute(
                                            """INSERT INTO college_branches (college_id, branch_id, total_seats)
                                               VALUES (%s, %s, %s)
                                               ON CONFLICT (college_id, branch_id)
                                               DO UPDATE SET total_seats = EXCLUDED.total_seats""",
                                            (college_id, branch_id, seats),
                                        )

                            except Exception as e:
                                console.print(f'[yellow]Row error: {e}[/yellow]')
                                continue

                    progress.update(task, advance=1)
                    conn.commit()

        conn.commit()
        console.print(f'\n[green]✓ Done![/green]')
        console.print(f'  Colleges: {colleges_added}')
        console.print(f'  Branches: {branches_added}')

    except Exception as e:
        console.print(f'[red]Fatal error: {e}[/red]')
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    extract_colleges()
