from fastapi.testclient import TestClient
import copy
import urllib.parse
import pytest

from src import app as app_module

client = TestClient(app_module.app)

@pytest.fixture(autouse=True)
def isolate_activities():
    """Make a deep copy of the in-memory activities and restore after each test."""
    original = copy.deepcopy(app_module.activities)
    try:
        yield
    finally:
        app_module.activities.clear()
        app_module.activities.update(original)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic sanity check for a known activity
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity_name = "Chess Club"
    test_email = "pytest_user@example.com"

    # ensure the email is not already present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity_name]["participants"]
    assert test_email not in participants

    # signup
    signup_url = f"/activities/{urllib.parse.quote(activity_name)}/signup?email={urllib.parse.quote(test_email)}"
    resp = client.post(signup_url)
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # check it's present
    resp = client.get("/activities")
    participants = resp.json()[activity_name]["participants"]
    assert test_email in participants

    # unregister
    unregister_url = f"/activities/{urllib.parse.quote(activity_name)}/unregister?email={urllib.parse.quote(test_email)}"
    resp = client.post(unregister_url)
    assert resp.status_code == 200
    body = resp.json()
    assert "Unregistered" in body.get("message", "")

    # verify removal
    resp = client.get("/activities")
    participants = resp.json()[activity_name]["participants"]
    assert test_email not in participants
 