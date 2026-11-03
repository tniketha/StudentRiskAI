
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime


Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(100), nullable=False)

    # Additional student information
    attendance_percentage = Column(Float, nullable=True)
    gpa = Column(Float, nullable=True)

    # Academic information used by the AI model
    g1 = Column(Integer, nullable=True)
    g2 = Column(Integer, nullable=True)
    studytime = Column(Integer, nullable=True)
    failures = Column(Integer, nullable=True)

    # AI prediction results
    risk_level = Column(String(20), nullable=True)
    risk_explanation = Column(JSON, nullable=True)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Integer, default=0, nullable=False)