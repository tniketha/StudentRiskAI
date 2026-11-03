from getpass import getpass

from database import SessionLocal
from models import Admin
from security import hash_password


db = SessionLocal()

try:
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")

    password = getpass("Enter admin password: ")
    confirm_password = getpass("Confirm admin password: ")

    if password != confirm_password:
        print("Passwords do not match!")
    elif len(password) < 12:
        print("Password must contain at least 12 characters.")
    else:
        existing_admin = db.query(Admin).filter(
            (Admin.username == username) |
            (Admin.email == email)
        ).first()

        if existing_admin:
            print("Username or email already exists!")
        else:
            new_admin = Admin(
                username=username,
                email=email,
                hashed_password=hash_password(password)
            )

            db.add(new_admin)
            db.commit()

            print("Admin account created successfully!")

except Exception as error:
    db.rollback()
    print("Error:", error)

finally:
    db.close()