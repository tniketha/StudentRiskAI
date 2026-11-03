from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


# Convert a normal password into a secure hash
def hash_password(password: str):
    return password_hash.hash(password)


# Check whether a password matches its stored hash
def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)