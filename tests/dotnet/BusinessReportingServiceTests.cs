using Microsoft.Extensions.Logging.Abstractions;
using SalesInsight.Api.DTOs;
using SalesInsight.Api.Services;
using Xunit;

namespace SalesInsight.Tests;

public class BusinessReportingServiceTests
{
    private readonly BusinessReportingService _service;

    public BusinessReportingServiceTests()
    {
        _service = new BusinessReportingService(NullLogger<BusinessReportingService>.Instance);
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsValidEmpiricalSummary()
    {
        // Act
        var result = await _service.GetSummaryAsync("ds_superstore_2026");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("ds_superstore_2026", result.DatasetId);
        Assert.Equal(2297200.86m, result.Kpis.TotalSales);
        Assert.Equal(286397.02m, result.Kpis.TotalProfit);
        Assert.Equal(12.47m, result.Kpis.ProfitMarginPct);
        Assert.Equal(5009, result.Kpis.TotalOrders);
        Assert.NotEmpty(result.Categories);
        Assert.NotEmpty(result.Regions);
        Assert.NotEmpty(result.DiscountSensitivity);
        Assert.NotEmpty(result.ExecutiveFlags);
    }

    [Fact]
    public async Task ValidateAnalyticalPayloadAsync_ValidPayload_ReturnsTrue()
    {
        // Arrange: Consistent sales, profit, and margin (Margin = 286,397.02 / 2,297,200.86 * 100 = 12.467%)
        var kpis = new HeadlineKpisDto
        {
            TotalSales = 2297200.86m,
            TotalProfit = 286397.02m,
            ProfitMarginPct = 12.47m,
            TotalOrders = 5009,
        };

        // Act
        var isValid = await _service.ValidateAnalyticalPayloadAsync(kpis);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public async Task ValidateAnalyticalPayloadAsync_InconsistentMargin_ReturnsFalse()
    {
        // Arrange: Inconsistent profit margin (says 50% when it should be 10%)
        var kpis = new HeadlineKpisDto
        {
            TotalSales = 1000m,
            TotalProfit = 100m,
            ProfitMarginPct = 50.0m, // Inconsistent
            TotalOrders = 10,
        };

        // Act
        var isValid = await _service.ValidateAnalyticalPayloadAsync(kpis);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public async Task ValidateAnalyticalPayloadAsync_ZeroOrNegativeSales_ReturnsFalse()
    {
        var kpisZero = new HeadlineKpisDto { TotalSales = 0m, TotalOrders = 5 };
        var kpisNeg = new HeadlineKpisDto { TotalSales = -500m, TotalOrders = 5 };

        Assert.False(await _service.ValidateAnalyticalPayloadAsync(kpisZero));
        Assert.False(await _service.ValidateAnalyticalPayloadAsync(kpisNeg));
    }
}
