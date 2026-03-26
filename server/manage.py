#!/usr/bin/env python3
"""
Django-style management commands for FastAPI project.
Provides makemigrations, migrate, and runserver commands using Alembic and Uvicorn.
"""
import sys
import argparse
import uvicorn
from alembic.config import Config
from alembic import command


def makemigrations(message):
    """Create new migration (equivalent to Django makemigrations)"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.revision(alembic_cfg, autogenerate=True, message=message)
        print(f"✅ Migration created: {message}")
        print("💡 Run 'python manage.py migrate' to apply the migration")
    except Exception as e:
        print(f"❌ Error creating migration: {e}")
        sys.exit(1)


def migrate():
    """Apply migrations (equivalent to Django migrate)"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations applied successfully")
    except Exception as e:
        print(f"❌ Error applying migrations: {e}")
        sys.exit(1)


def show_status():
    """Show current migration status"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.current(alembic_cfg)
    except Exception as e:
        print(f"❌ Error checking migration status: {e}")
        sys.exit(1)


def rollback(steps=1):
    """Rollback migrations by specified number of steps"""
    try:
        alembic_cfg = Config("alembic.ini")
        target = f"-{steps}"
        command.downgrade(alembic_cfg, target)
        print(f"✅ Rolled back {steps} migration(s)")
    except Exception as e:
        print(f"❌ Error rolling back migrations: {e}")
        sys.exit(1)


def rollback_to(revision):
    """Rollback to a specific migration revision"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.downgrade(alembic_cfg, revision)
        print(f"✅ Rolled back to revision: {revision}")
    except Exception as e:
        print(f"❌ Error rolling back to revision {revision}: {e}")
        sys.exit(1)


def history():
    """Show migration history"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.history(alembic_cfg)
    except Exception as e:
        print(f"❌ Error showing migration history: {e}")
        sys.exit(1)


def resetdb():
    """Drop all tables and reset Alembic version tracking (downgrade to base)"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.downgrade(alembic_cfg, "base")
        print("✅ All migrations reverted, tables dropped")
        print("💡 Delete migration files in migrations/versions/, then run:")
        print("   python manage.py makemigrations \"Initial schema\"")
        print("   python manage.py migrate")
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        sys.exit(1)


def runserver(host="0.0.0.0", port=8003, reload=True):
    """Run the FastAPI development server (equivalent to Django runserver)"""
    try:
        print(f"🚀 Starting FastAPI server at http://{host}:{port}")
        print("💡 Press CTRL+C to quit")
        uvicorn.run("main:app", host=host, port=port, reload=reload)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Django-style management commands for FastAPI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manage.py makemigrations "Add user profile model"
  python manage.py migrate
  python manage.py rollback
  python manage.py rollback 2
  python manage.py rollback-to 10fa934d3468
  python manage.py status
  python manage.py history
  python manage.py resetdb
  python manage.py runserver
  python manage.py runserver --port 3000
  python manage.py runserver --host 127.0.0.1 --port 8080
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # makemigrations command
    makemig_parser = subparsers.add_parser(
        'makemigrations', 
        help='Create new migration (like alembic revision --autogenerate)'
    )
    makemig_parser.add_argument(
        'message', 
        help='Migration message describing the changes'
    )
    
    # migrate command  
    subparsers.add_parser(
        'migrate', 
        help='Apply migrations (like alembic upgrade head)'
    )
    
    # rollback command
    rollback_parser = subparsers.add_parser(
        'rollback',
        help='Rollback migrations (like alembic downgrade)'
    )
    rollback_parser.add_argument(
        'steps',
        nargs='?',
        type=int,
        default=1,
        help='Number of migrations to rollback (default: 1)'
    )
    
    # rollback-to command
    rollback_to_parser = subparsers.add_parser(
        'rollback-to',
        help='Rollback to a specific migration revision'
    )
    rollback_to_parser.add_argument(
        'revision',
        help='Migration revision ID to rollback to'
    )
    
    # status command
    subparsers.add_parser(
        'status',
        help='Show current migration status'
    )
    
    # history command
    subparsers.add_parser(
        'history',
        help='Show migration history'
    )
    
    # resetdb command
    subparsers.add_parser(
        'resetdb',
        help='Drop all tables and reset Alembic version tracking'
    )

    # runserver command
    runserver_parser = subparsers.add_parser(
        'runserver',
        help='Run the FastAPI development server (like Django runserver)'
    )
    runserver_parser.add_argument(
        '--host',
        default='0.0.0.0',
        help='Host to bind to (default: 0.0.0.0)'
    )
    runserver_parser.add_argument(
        '--port',
        type=int,
        default=8003,
        help='Port to bind to (default: 8003)'
    )
    runserver_parser.add_argument(
        '--no-reload',
        action='store_true',
        help='Disable auto-reload (default: auto-reload enabled)'
    )
    
    # Parse arguments
    args = parser.parse_args()
    
    # Execute commands
    if args.command == 'makemigrations':
        makemigrations(args.message)
    elif args.command == 'migrate':
        migrate()
    elif args.command == 'rollback':
        rollback(args.steps)
    elif args.command == 'rollback-to':
        rollback_to(args.revision)
    elif args.command == 'status':
        show_status()
    elif args.command == 'history':
        history()
    elif args.command == 'resetdb':
        resetdb()
    elif args.command == 'runserver':
        runserver(host=args.host, port=args.port, reload=not args.no_reload)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()