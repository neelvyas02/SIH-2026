import pytest
from app.models.user import User
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "backend"}


@pytest.mark.asyncio
async def test_login_success(client, async_db):
    user = User(
        id="test-user-id",
        username="officer_test",
        email="test@borderguard.gov.in",
        hashed_password=get_password_hash("password123"),
        full_name="Officer Test",
        role="operator",
        is_active=True
    )
    async_db.add(user)
    await async_db.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "officer_test", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "officer_test"


@pytest.mark.asyncio
async def test_login_failure(client, async_db):
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "non_existent", "password": "wrong_password"}
    )
    assert response.status_code == 401
