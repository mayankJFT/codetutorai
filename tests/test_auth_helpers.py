from backend_auth_helpers import hash_password, normalize_email, verify_password


def test_long_password_roundtrip_does_not_crash():
    pw = "x" * 300  # bcrypt hard-limits input to 72 bytes; must not raise
    hashed = hash_password(pw)
    assert verify_password(pw, hashed)
    assert not verify_password("y" * 300, hashed)


def test_normalize_email_lowercases_and_trims():
    assert normalize_email("  User@Example.COM ") == "user@example.com"
