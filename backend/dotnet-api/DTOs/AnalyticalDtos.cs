namespace SalesInsight.Api.DTOs;

public class HeadlineKpisDto
{
    public decimal TotalSales { get; set; }
    public decimal TotalProfit { get; set; }
    public decimal ProfitMarginPct { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int TotalUnitsSold { get; set; }
    public int TotalCustomers { get; set; }
    public decimal AverageDiscountPct { get; set; }
}

public class CategoryPerformanceDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Sales { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMarginPct { get; set; }
    public decimal SalesSharePct { get; set; }
    public int DistinctOrders { get; set; }
}

public class RegionalPerformanceDto
{
    public string Region { get; set; } = string.Empty;
    public decimal Sales { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMarginPct { get; set; }
    public int DistinctOrders { get; set; }
    public decimal Aov { get; set; }
}

public class DiscountBandDto
{
    public string DiscountBand { get; set; } = string.Empty;
    public decimal Sales { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMarginPct { get; set; }
    public string HealthStatus { get; set; } = "Normal";
}

public class BusinessSummaryDto
{
    public string DatasetId { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
    public HeadlineKpisDto Kpis { get; set; } = new();
    public List<CategoryPerformanceDto> Categories { get; set; } = new();
    public List<RegionalPerformanceDto> Regions { get; set; } = new();
    public List<DiscountBandDto> DiscountSensitivity { get; set; } = new();
    public List<string> ExecutiveFlags { get; set; } = new();
}
