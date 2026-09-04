from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for obtaining database sessions per request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from sqlalchemy import text


def init_db():
    """Initializes database tables and auto-migrates missing columns"""
    import app.models.db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Auto-migrate image_base64 column if missing in existing SQLite database
    try:
        with engine.connect() as conn:
            # Check existing columns
            res = conn.execute(text("PRAGMA table_info(scan_records);")).fetchall()
            cols = [r[1] for r in res]
            if "image_base64" not in cols:
                conn.execute(text("ALTER TABLE scan_records ADD COLUMN image_base64 TEXT;"))
                conn.commit()
    except Exception as e:
        print(f"Database migration notice: {e}")

