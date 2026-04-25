"""
Extract marks vs rank mapping from KEA data files.

Usage:
  python extract_marks_rank.py --file "marks_rank_2024.pdf" --year 2024
  python extract_marks_rank.py --file "marks_rank_2024.csv" --year 2024
"""

import os
import sys

import click
import pandas as pd
import pdfplumber
import psycopg2
from dotenv import load_dotenv
from rich.console import Console

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

console = Console()


def get_db_connection():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        console.print('[red]ERROR: DATABASE_URL not set in .env[/red]')
        sys.exit(1)
    return psycopg2.connect(db_url)


def parse_csv(filepath: str) -> pd.DataFrame:
    """Parse CSV format marks-rank file."""
    df = pd.read_csv(filepath)
    # Normalize column names
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
    return df


def parse_pdf(filepath: str) -> pd.DataFrame:
    """Parse PDF format marks-rank file."""
    rows = []
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                for row in table[1:]:
                    if row and len(row) >= 3:
                        try:
                            marks = float(str(row[0]).strip().replace(',', ''))
                            rank_min = int(float(str(row[1]).strip().replace(',', '')))
                            rank_max = int(float(str(row[2]).strip().replace(',', '')))
                            rows.append({
                                'kcet_marks': marks,
                                'rank_min': rank_min,
                                'rank_max': rank_max,
                            })
                        except (ValueError, TypeError, IndexError):
                            continue

    return pd.DataFrame(rows)


@click.command()
@click.option('--file', required=True, help='Path to marks-rank PDF or CSV')
@click.option('--year', required=True, type=int, help='Year of the data')
def extract_marks_rank(file: str, year: int):
    """Extract marks vs rank mapping and write to database."""
    if not os.path.exists(file):
        console.print(f'[red]File not found: {file}[/red]')
        sys.exit(1)

    console.print(f'[bold]Extracting marks-rank from:[/bold] {file}')
    console.print(f'[bold]Year:[/bold] {year}')

    # Parse based on file extension
    ext = os.path.splitext(file)[1].lower()
    if ext == '.csv':
        df = parse_csv(file)
    elif ext == '.pdf':
        df = parse_pdf(file)
    else:
        console.print(f'[red]Unsupported file type: {ext}[/red]')
        sys.exit(1)

    if df.empty:
        console.print('[yellow]No data extracted from file.[/yellow]')
        sys.exit(1)

    # Ensure required columns
    required = {'kcet_marks', 'rank_min', 'rank_max'}
    if not required.issubset(set(df.columns)):
        console.print(f'[red]Missing columns. Found: {list(df.columns)}[/red]')
        console.print(f'[red]Required: {required}[/red]')
        sys.exit(1)

    conn = get_db_connection()
    cursor = conn.cursor()

    inserted = 0
    try:
        for _, row in df.iterrows():
            pu_pct = row.get('pu_percentage', None)
            if pd.isna(pu_pct):
                pu_pct = None

            cursor.execute(
                """INSERT INTO marks_rank_map (year, kcet_marks, pu_percentage, rank_min, rank_max)
                   VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (year, kcet_marks)
                   DO UPDATE SET
                     rank_min = EXCLUDED.rank_min,
                     rank_max = EXCLUDED.rank_max,
                     pu_percentage = EXCLUDED.pu_percentage""",
                (year, float(row['kcet_marks']), pu_pct,
                 int(row['rank_min']), int(row['rank_max'])),
            )
            inserted += 1

        conn.commit()
        console.print(f'\n[green]✓ Done! Inserted/updated {inserted} rows.[/green]')

    except Exception as e:
        console.print(f'[red]Error: {e}[/red]')
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    extract_marks_rank()
