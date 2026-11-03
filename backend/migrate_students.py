from sqlalchemy import text
from database import engine

migration_sql = """
ALTER TABLE students
ADD COLUMN IF NOT EXISTS g1 INTEGER,
ADD COLUMN IF NOT EXISTS g2 INTEGER,
ADD COLUMN IF NOT EXISTS studytime INTEGER,
ADD COLUMN IF NOT EXISTS failures INTEGER,
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS risk_explanation JSON;
"""

with engine.begin() as connection:
    connection.execute(text(migration_sql))

print("Student table updated successfully!")