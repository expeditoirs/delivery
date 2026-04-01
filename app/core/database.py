from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = BASE_DIR / 'data' / 'delivery.sqlite.db'
DEFAULT_SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
DEFAULT_DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"

Base = declarative_base()


def _build_engine(database_url: str):
    connect_args = {'check_same_thread': False} if database_url.startswith('sqlite') else {}
    engine_kwargs = {'connect_args': connect_args}

    if not database_url.startswith('sqlite'):
        engine_kwargs.update({
            'pool_pre_ping': True,
            'pool_size': int(os.getenv('DB_POOL_SIZE', '20')),
            'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '30')),
            'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '1800')),
        })

    return create_engine(database_url, **engine_kwargs)


requested_url = os.getenv('DATABASE_URL')
DATABASE_URL = requested_url or DEFAULT_DATABASE_URL

try:
    engine = _build_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
except Exception:
    DATABASE_URL = DEFAULT_DATABASE_URL
    engine = _build_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
