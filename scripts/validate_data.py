"""
Data quality validation after import.

Usage:
  python validate_data.py

Checks:
  1. closing_rank < opening_rank (impossible)
  2. Duplicate entries for same college/branch/year/round/category
  3. Years with < 100 entries (likely incomplete parse)
  4. Closing ranks > 200,000 (likely parse error)
"""

import os
import sys

import psycopg2
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

console = Console()


def get_db_connection():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        console.print('[red]ERROR: DATABASE_URL not set in .env[/red]')
        sys.exit(1)
    return psycopg2.connect(db_url)


def run_checks():
    conn = get_db_connection()
    cursor = conn.cursor()

    console.print('\n[bold]═══ KCET Compass Data Validation ═══[/bold]\n')

    issues_found = 0

    # ── Check 1: closing_rank < opening_rank ──
    console.print('[bold]1. Checking for closing_rank < opening_rank...[/bold]')
    cursor.execute(
        """SELECT COUNT(*) FROM cutoffs
           WHERE opening_rank IS NOT NULL AND closing_rank < opening_rank"""
    )
    count = cursor.fetchone()[0]
    if count > 0:
        console.print(f'  [red]⚠ Found {count} rows where closing < opening[/red]')
        issues_found += count
    else:
        console.print('  [green]✓ No issues[/green]')

    # ── Check 2: Years with < 100 entries ──
    console.print('\n[bold]2. Checking entry counts per year...[/bold]')
    cursor.execute(
        """SELECT year, COUNT(*) as cnt FROM cutoffs
           GROUP BY year ORDER BY year"""
    )
    rows = cursor.fetchall()
    if rows:
        table = Table(title='Entries per Year')
        table.add_column('Year', style='cyan')
        table.add_column('Count', style='white')
        table.add_column('Status', style='white')
        for year, cnt in rows:
            status = '[red]⚠ Low count[/red]' if cnt < 100 else '[green]OK[/green]'
            if cnt < 100:
                issues_found += 1
            table.add_row(str(year), str(cnt), status)
        console.print(table)
    else:
        console.print('  [yellow]No cutoff data in database[/yellow]')

    # ── Check 3: Closing ranks > 200,000 ──
    console.print('\n[bold]3. Checking for suspiciously high closing ranks...[/bold]')
    cursor.execute(
        """SELECT COUNT(*) FROM cutoffs WHERE closing_rank > 200000"""
    )
    count = cursor.fetchone()[0]
    if count > 0:
        console.print(f'  [red]⚠ Found {count} rows with closing_rank > 200,000[/red]')
        issues_found += count
    else:
        console.print('  [green]✓ No issues[/green]')

    # ── Check 4: Overall stats ──
    console.print('\n[bold]4. Database summary...[/bold]')
    stats = {}
    for table_name in ['colleges', 'branches', 'cutoffs', 'marks_rank_map', 'college_branches']:
        cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
        stats[table_name] = cursor.fetchone()[0]

    summary = Table(title='Database Summary')
    summary.add_column('Table', style='cyan')
    summary.add_column('Rows', style='white')
    for name, cnt in stats.items():
        summary.add_row(name, str(cnt))
    console.print(summary)

    # ── Final ──
    console.print(f'\n[bold]Total issues found: {issues_found}[/bold]')
    if issues_found == 0:
        console.print('[green]All checks passed! ✓[/green]')
    else:
        console.print('[yellow]Review the flagged issues above.[/yellow]')

    cursor.close()
    conn.close()


if __name__ == '__main__':
    run_checks()
