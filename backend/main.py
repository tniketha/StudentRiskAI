
import sys
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from database import engine, SessionLocal
from models import Base, Student, Admin, PasswordResetToken
from schemas import StudentCreate, AdminLogin, PasswordResetRequest, PasswordResetConfirm, AdminCreate
from auth import (
    authenticate_admin,
    create_access_token,
    create_password_reset_token, hash_reset_token,
    SECRET_KEY,
    ALGORITHM
)
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from security import hash_password

# Connect the ML model folder
ML_DIR = Path(__file__).resolve().parent.parent / "ml"
sys.path.insert(0, str(ML_DIR))

from predict_student import predict_student

security = HTTPBearer()

app = FastAPI(title="StudentRiskAI")

mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

fast_mail = FastMail(mail_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Welcome to StudentRiskAI!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Verify admin JWT token
def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    admin = db.query(Admin).filter(
        Admin.username == username
    ).first()

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Admin not found"
        )

    return admin


# Convert a student record into a response dictionary
def student_response(student):
    return {
        "id": student.id,
        "student_name": student.student_name,
        "attendance_percentage": student.attendance_percentage,
        "gpa": student.gpa,
        "g1": student.g1,
        "g2": student.g2,
        "studytime": student.studytime,
        "failures": student.failures,
        "risk_level": student.risk_level,
        "risk_explanation": student.risk_explanation
    }


# Generate AI prediction
def generate_prediction(student_data):
    return predict_student({
        "G1": student_data.g1,
        "G2": student_data.g2,
        "studytime": student_data.studytime,
        "failures": student_data.failures
    })


# Add a student and generate AI prediction
@app.post("/students")
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    try:
        prediction = generate_prediction(student)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI prediction failed: {str(error)}"
        )

    new_student = Student(
        student_name=student.student_name,
        attendance_percentage=student.attendance_percentage,
        gpa=student.gpa,
        g1=student.g1,
        g2=student.g2,
        studytime=student.studytime,
        failures=student.failures,
        risk_level=prediction["risk_level"],
        risk_explanation=prediction["reasons"]
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "message": "Student added successfully!",
        **student_response(new_student)
    }


# Get all students
@app.get("/students")
def get_students(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    students = db.query(Student).all()
    return [student_response(student) for student in students]


# Get one student
@app.get("/students/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student_response(student)


# Update student and regenerate prediction
@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    try:
        prediction = generate_prediction(student_data)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI prediction failed: {str(error)}"
        )

    student.student_name = student_data.student_name
    student.attendance_percentage = student_data.attendance_percentage
    student.gpa = student_data.gpa
    student.g1 = student_data.g1
    student.g2 = student_data.g2
    student.studytime = student_data.studytime
    student.failures = student_data.failures
    student.risk_level = prediction["risk_level"]
    student.risk_explanation = prediction["reasons"]

    db.commit()
    db.refresh(student)

    return {
        "message": "Student updated successfully!",
        **student_response(student)
    }


# Delete student
@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully!"}

@app.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(
        Admin.email == request.email
    ).first()

    # Always return the same message to avoid revealing registered emails
    message = {
        "message": "If the email is registered, a password reset link will be sent."
    }

    if admin is None:
        return message

    raw_token = create_password_reset_token()
    token_hash = hash_reset_token(raw_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", 15))
    )

    reset_record = PasswordResetToken(
        admin_id=admin.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=0
    )

    db.add(reset_record)
    db.commit()

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    reset_url = f"{frontend_url}/reset-password?token={raw_token}"

    email = MessageSchema(
        subject="StudentRiskAI Password Reset",
        recipients=[admin.email],
        body=f"""
        Hello,

        You requested to reset your StudentRiskAI password.

        Use this link to set a new password:
        {reset_url}

        This link expires in 15 minutes. If you did not request this,
        you can ignore this email.
        """,
        subtype="plain"
    )

    await fast_mail.send_message(email)

    return message

@app.post("/reset-password")
def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    token_hash = hash_reset_token(request.token)

    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == 0
    ).first()

    if reset_record is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or already used reset token"
        )

    if reset_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired"
        )

    admin = db.query(Admin).filter(
        Admin.id == reset_record.admin_id
    ).first()

    if admin is None:
        raise HTTPException(
            status_code=400,
            detail="Admin account not found"
        )

    admin.hashed_password = hash_password(request.new_password)
    reset_record.used = 1

    db.commit()

    return {"message": "Password reset successful!"}
    
# Admin login
@app.post("/login")
def admin_login(
    login_data: AdminLogin,
    db: Session = Depends(get_db)
):
    admin = authenticate_admin(
        db,
        login_data.username,
        login_data.password
    )

    access_token = create_access_token(
        data={"sub": admin.username}
    )

    return {
        "message": "Login successful!",
        "access_token": access_token,
        "token_type": "bearer"
    }

    # Create a new admin account (existing admins only)
@app.post("/admins")
def create_admin(
    admin_data: AdminCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing_admin = db.query(Admin).filter(
        (Admin.username == admin_data.username) |
        (Admin.email == admin_data.email)
    ).first()

    if existing_admin:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists."
        )

    new_admin = Admin(
        username=admin_data.username,
        email=admin_data.email,
        hashed_password=hash_password(admin_data.password)
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "message": "Admin account created successfully!",
        "admin_id": new_admin.id,
        "username": new_admin.username,
        "email": new_admin.email
    }