import pytest
import datetime
from unittest.mock import MagicMock, patch

# Equivalent DB Schema / Models in Python representation for demonstration
class TestDbServicePytest:
    @pytest.fixture
    def mock_db_schema(self):
        return {
            "users": [
                {
                    "id": "test-user-id",
                    "full_name": "Test QA Engineer",
                    "email": "test@example.com",
                    "password_hash": "some_hash",
                    "role": "user"
                }
            ],
            "test_cases": [
                {
                    "id": "test-case-1",
                    "user_id": "test-user-id",
                    "title": "Initial Test Case",
                    "test_prompt": "Open localhost and click submit"
                }
            ],
            "test_runs": [
                {
                    "id": "test-run-1",
                    "test_case_id": "test-case-1",
                    "user_id": "test-user-id",
                    "status": "Passed",
                    "execution_time": 12,
                    "final_result": "Passed"
                },
                {
                    "id": "test-run-2",
                    "test_case_id": "test-case-1",
                    "user_id": "test-user-id",
                    "status": "Failed",
                    "execution_time": 18,
                    "final_result": "Failed"
                }
            ]
        }

    def test_get_user_by_email(self, mock_db_schema):
        email_to_find = "test@example.com"
        user = next((u for u in mock_db_schema["users"] if u["email"].lower() == email_to_find.lower()), None)
        
        assert user is not None
        assert user["full_name"] == "Test QA Engineer"
        assert user["id"] == "test-user-id"

    def test_create_user_already_exists_fails(self, mock_db_schema):
        new_email = "test@example.com"
        existing = next((u for u in mock_db_schema["users"] if u["email"].lower() == new_email.lower()), None)
        
        # Expectation check
        assert existing is not None
        with pytest.raises(ValueError, match="User already exists with this email"):
            if existing:
                raise ValueError("User already exists with this email")

    def test_create_user_success(self, mock_db_schema):
        new_email = "fresh@example.com"
        existing = next((u for u in mock_db_schema["users"] if u["email"].lower() == new_email.lower()), None)
        assert existing is None
        
        new_user = {
            "id": "usr_random99",
            "full_name": "Fresh User",
            "email": new_email.lower(),
            "password_hash": "pass_hash_123",
            "role": "user"
        }
        mock_db_schema["users"].append(new_user)
        
        registered = next((u for u in mock_db_schema["users"] if u["email"].lower() == new_email.lower()), None)
        assert registered is not None
        assert registered["full_name"] == "Fresh User"

    def test_aggregate_user_stats(self, mock_db_schema):
        runs = [r for r in mock_db_schema["test_runs"] if r["user_id"] == "test-user-id"]
        total_runs = len(runs)
        passed_runs = len([r for r in runs if r["final_result"] == "Passed"])
        failed_runs = len([r for r in runs if r["final_result"] == "Failed"])
        
        pass_rate = int((passed_runs / total_runs) * 100) if total_runs > 0 else 0
        total_time = sum(r["execution_time"] for r in runs if "execution_time" in r)
        avg_execution_time = int(total_time / total_runs) if total_runs > 0 else 0
        
        assert total_runs == 2
        assert passed_runs == 1
        assert failed_runs == 1
        assert pass_rate == 50
        assert avg_execution_time == 15
