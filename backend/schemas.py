from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    student_name: str = Field(min_length=1, max_length=100)

    # Additional information
    attendance_percentage: float | None = Field(
        default=None, ge=0, le=100
    )

    gpa: float | None = Field(
    default=None, ge=0, le=4
    )

    # Academic information for AI prediction
    g1: int = Field(ge=0, le=20)
    g2: int = Field(ge=0, le=20)
    studytime: int = Field(ge=1, le=4)
    failures: int = Field(ge=0, le=4)


class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)