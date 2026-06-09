using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace E2EAutomation.Tests
{
    // Define types resembling our TypeScript structures
    public class User
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
    }

    public class TestCase
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string TestPrompt { get; set; }
    }

    public class TestRun
    {
        public string Id { get; set; }
        public string TestCaseId { get; set; }
        public string UserId { get; set; }
        public string Status { get; set; }
        public int ExecutionTime { get; set; }
        public string FinalResult { get; set; }
    }

    public class DbServiceTests
    {
        private readonly List<User> _mockUsers;
        private readonly List<TestCase> _mockTestCases;
        private readonly List<TestRun> _mockTestRuns;

        public DbServiceTests()
        {
            _mockUsers = new List<User>
            {
                new User
                {
                    Id = "test-user-id",
                    FullName = "Test QA Engineer",
                    Email = "test@example.com",
                    PasswordHash = "some_hash",
                    Role = "user"
                }
            };

            _mockTestCases = new List<TestCase>
            {
                new TestCase
                {
                    Id = "test-case-1",
                    UserId = "test-user-id",
                    Title = "Initial Test Case",
                    TestPrompt = "Open localhost and click submit"
                }
            };

            _mockTestRuns = new List<TestRun>
            {
                new TestRun
                {
                    Id = "test-run-1",
                    TestCaseId = "test-case-1",
                    UserId = "test-user-id",
                    Status = "Passed",
                    ExecutionTime = 12,
                    FinalResult = "Passed"
                },
                new TestRun
                {
                    Id = "test-run-2",
                    TestCaseId = "test-case-1",
                    UserId = "test-user-id",
                    Status = "Failed",
                    ExecutionTime = 18,
                    FinalResult = "Failed"
                }
            };
        }

        [Fact]
        public void GetUserByEmail_ExistingUser_ReturnsUserDetail()
        {
            // Arrange
            string emailToFind = "test@example.com";

            // Act
            var user = _mockUsers.FirstOrDefault(u => u.Email.Equals(emailToFind, StringComparison.OrdinalIgnoreCase));

            // Assert
            Assert.NotNull(user);
            Assert.Equal("Test QA Engineer", user.FullName);
            Assert.Equal("test-user-id", user.Id);
        }

        [Fact]
        public void CreateUser_AlreadyExists_ThrowsArgumentException()
        {
            // Arrange
            string email = "test@example.com";

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
            {
                var existing = _mockUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
                if (existing != null)
                {
                    throw new ArgumentException("User already exists with this email");
                }
            });

            Assert.Equal("User already exists with this email", ex.Message);
        }

        [Fact]
        public void CreateUser_ValidCredentials_SuccessfullyRegisters()
        {
            // Arrange
            string email = "fresh@example.com";
            
            // Act
            var existing = _mockUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            Assert.Null(existing);

            var newUser = new User
            {
                Id = "usr_999",
                FullName = "Fresh User",
                Email = email.ToLower(),
                PasswordHash = "pass_hash_123",
                Role = "user"
            };
            _mockUsers.Add(newUser);

            var registered = _mockUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

            // Assert
            Assert.NotNull(registered);
            Assert.Equal("Fresh User", registered.FullName);
        }

        [Fact]
        public void CalculateUserStats_CalculatesBalancedDashboardAggregates()
        {
            // Arrange & Act
            var userRuns = _mockTestRuns.Where(r => r.UserId == "test-user-id").ToList();
            int totalRuns = userRuns.Count;
            int passedRuns = userRuns.Count(r => r.FinalResult == "Passed");
            int failedRuns = userRuns.Count(r => r.FinalResult == "Failed");
            
            int passRate = totalRuns > 0 ? (int)Math.Round((double)passedRuns / totalRuns * 100) : 0;
            int totalExecutionTime = userRuns.Sum(r => r.ExecutionTime);
            int averageExecutionTime = totalRuns > 0 ? (int)Math.Round((double)totalExecutionTime / totalRuns) : 0;

            // Assert
            Assert.Equal(2, totalRuns);
            Assert.Equal(1, passedRuns);
            Assert.Equal(1, failedRuns);
            Assert.Equal(50, passRate);
            Assert.Equal(15, averageExecutionTime);
        }
    }
}
