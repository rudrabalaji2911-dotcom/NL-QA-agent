import pytest
from unittest.mock import MagicMock, patch

class BrowserSimulatorPython:
    def __init__(self, run_id, user_id):
        self.run_id = run_id
        self.user_id = user_id
        self.logs = []

    def add_log(self, level, message):
        self.logs.append({"level": level, "message": message})

    def open_url(self, url):
        trimmed_url = url.strip()
        lower_url = trimmed_url.lower()
        
        is_explicitly_wrong = "wrong" in lower_url or "invalid" in lower_url or "fail" in lower_url or "offline" in lower_url
        if is_explicitly_wrong:
            self.add_log("error", "Navigation failed: Target host or domain reachable state offline.")
            raise ConnectionError(f"Navigation failed: Reachability check failed for target '{trimmed_url}'")
            
        is_local_demo = lower_url in ["demo", "http://demo", "https://demo", "/demo"]
        is_general_demo = ("demo" in lower_url and "saucedemo" not in lower_url) or "example" in lower_url or "localhost" in lower_url
        
        if is_local_demo or is_general_demo:
            target_url = "http://localhost:3000/demo"
            self.add_log("info", f"Mapping standard demo sandbox URL to dynamic local server: {target_url}")
        else:
            target_url = trimmed_url
            if not target_url.startswith(("http://", "https://")):
                target_url = "https://" + target_url
                self.add_log("info", f"Auto-prepended protocol for robustness -> {target_url}")
                
        self.add_log("info", f"Page successfully loaded: {target_url}")
        return {"status": "ok", "url": target_url}


class TestBrowserSimulatorPytest:
    @pytest.fixture
    def simulator(self):
        return BrowserSimulatorPython("run-abc-123", "user-xyz-789")

    def test_initial_state(self, simulator):
        assert len(simulator.logs) == 0

    def test_open_url_mapping(self, simulator):
        result = simulator.open_url("https://demo.example.com")
        assert result["status"] == "ok"
        assert result["url"] == "http://localhost:3000/demo"
        
        # Verify mapping logs are appended
        mapping_logs = [log for log in simulator.logs if "Mapping standard demo sandbox" in log["message"]]
        assert len(mapping_logs) > 0

    def test_open_url_prepend_protocol(self, simulator):
        result = simulator.open_url("my-retail-site.com")
        assert result["status"] == "ok"
        assert result["url"] == "https://my-retail-site.com"
        
        # Verify prepend logs are appended
        prepend_logs = [log for log in simulator.logs if "Auto-prepended protocol" in log["message"]]
        assert len(prepend_logs) > 0

    def test_open_url_offline_failure(self, simulator):
        with pytest.raises(ConnectionError):
            simulator.open_url("https://invalid-host-will-offline.com")
            
        error_logs = [log for log in simulator.logs if log["level"] == "error"]
        assert len(error_logs) > 0
        assert "Target host or domain reachable state offline" in error_logs[0]["message"]
