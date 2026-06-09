using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace E2EAutomation.Tests
{
    public class ExecutionLog
    {
        public string Level { get; set; }
        public string Message { get; set; }
    }

    public class BrowserSimulatorDotNet
    {
        public string RunId { get; }
        public string UserId { get; }
        public List<ExecutionLog> Logs { get; }

        public BrowserSimulatorDotNet(string runId, string userId)
        {
            RunId = runId;
            UserId = userId;
            Logs = new List<ExecutionLog>();
        }

        public void AddLog(string level, string message)
        {
            Logs.Add(new ExecutionLog { Level = level, Message = message });
        }

        public Dictionary<string, string> OpenUrl(string url)
        {
            string trimmedUrl = url.Trim();
            string lowerUrl = trimmedUrl.ToLower();

            bool isExplicitlyWrong = lowerUrl.Contains("wrong") || lowerUrl.Contains("invalid") || lowerUrl.Contains("fail") || lowerUrl.Contains("offline");
            if (isExplicitlyWrong)
            {
                AddLog("error", "Navigation failed: Target host or domain reachable state offline.");
                throw new InvalidOperationException($"Navigation failed: Reachability check failed for target '{trimmedUrl}'");
            }

            bool isLocalDemo = lowerUrl == "demo" || lowerUrl == "http://demo" || lowerUrl == "https://demo" || lowerUrl == "/demo";
            bool isGeneralDemo = (lowerUrl.Contains("demo") && !lowerUrl.Contains("saucedemo")) || lowerUrl.Contains("example") || lowerUrl.Contains("localhost");

            string targetUrl = trimmedUrl;
            if (isLocalDemo || isGeneralDemo)
            {
                targetUrl = "http://localhost:3000/demo";
                AddLog("info", $"Mapping standard demo sandbox URL to dynamic local server: {targetUrl}");
            }
            else
            {
                if (!targetUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && 
                    !targetUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    targetUrl = "https://" + targetUrl;
                    AddLog("info", $"Auto-prepended protocol for robustness -> {targetUrl}");
                }
            }

            AddLog("info", $"Page successfully loaded: {targetUrl}");
            return new Dictionary<string, string>
            {
                { "status", "ok" },
                { "url", targetUrl }
            };
        }
    }

    public class BrowserSimulatorTests
    {
        [Fact]
        public void InitialState_HasEmptyExecutionLogs()
        {
            // Arrange & Act
            var simulator = new BrowserSimulatorDotNet("run-111", "user-222");

            // Assert
            Assert.Empty(simulator.Logs);
        }

        [Fact]
        public void OpenUrl_DemoExampleDomain_MapsToLocalhostPreview()
        {
            // Arrange
            var simulator = new BrowserSimulatorDotNet("run-111", "user-222");

            // Act
            var result = simulator.OpenUrl("https://demo.example.com");

            // Assert
            Assert.Equal("ok", result["status"]);
            Assert.Equal("http://localhost:3000/demo", result["url"]);
            
            var hasMappingLog = simulator.Logs.Any(l => l.Message.Contains("Mapping standard demo sandbox URL to dynamic local server"));
            Assert.True(hasMappingLog);
        }

        [Fact]
        public void OpenUrl_PrependProtocol_AddsHttpsPrefix()
        {
            // Arrange
            var simulator = new BrowserSimulatorDotNet("run-111", "user-222");

            // Act
            var result = simulator.OpenUrl("my-retail-site.com");

            // Assert
            Assert.Equal("ok", result["status"]);
            Assert.Equal("https://my-retail-site.com", result["url"]);

            var hasPrependLog = simulator.Logs.Any(l => l.Message.Contains("Auto-prepended protocol"));
            Assert.True(hasPrependLog);
        }

        [Fact]
        public void OpenUrl_ExplicitOfflineUrl_ThrowsInvalidOperationException()
        {
            // Arrange
            var simulator = new BrowserSimulatorDotNet("run-111", "user-222");

            // Act & Assert
            var ex = Assert.Throws<InvalidOperationException>(() =>
            {
                simulator.OpenUrl("https://invalid-host-will-fail.com");
            });

            Assert.Contains("Reachability check failed", ex.Message);
            
            var errorLog = simulator.Logs.FirstOrDefault(l => l.Level == "error");
            Assert.NotNull(errorLog);
            Assert.Contains("Target host or domain reachable state offline", errorLog.Message);
        }
    }
}
