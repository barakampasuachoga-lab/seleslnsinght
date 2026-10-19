using Microsoft.AspNetCore.Mvc;
using SalesInsight.Api.DTOs;
using SalesInsight.Api.Services;

namespace SalesInsight.Api.Controllers;

[ApiController]
[Route("api/v1/business")]
public class BusinessController : ControllerBase
{
    private readonly IBusinessReportingService _reportingService;
    private readonly ILogger<BusinessController> _logger;

    public BusinessController(IBusinessReportingService reportingService, ILogger<BusinessController> logger)
    {
        _reportingService = reportingService;
        _logger = logger;
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "Healthy",
            service = "SalesInsight.BusinessApi",
            runtime = ".NET 8.0",
            timestamp = DateTime.UtcNow
        });
    }

    [HttpGet("summary/{datasetId}")]
    public async Task<ActionResult<BusinessSummaryDto>> GetSummary(string datasetId)
    {
        try
        {
            var result = await _reportingService.GetSummaryAsync(datasetId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating summary for dataset {DatasetId}", datasetId);
            return StatusCode(500, new { error = "An error occurred while generating the business summary." });
        }
    }

    [HttpGet("performance/{datasetId}")]
    public async Task<IActionResult> GetPerformance(string datasetId, [FromQuery] string dimension = "category")
    {
        if (dimension.Equals("region", StringComparison.OrdinalIgnoreCase))
        {
            var regions = await _reportingService.GetRegionalPerformanceAsync(datasetId);
            return Ok(regions);
        }

        var categories = await _reportingService.GetCategoryPerformanceAsync(datasetId);
        return Ok(categories);
    }

    [HttpPost("validate-payload")]
    public async Task<IActionResult> ValidatePayload([FromBody] HeadlineKpisDto kpis)
    {
        var isValid = await _reportingService.ValidateAnalyticalPayloadAsync(kpis);
        if (!isValid)
        {
            return BadRequest(new { valid = false, message = "Payload failed mathematical consistency checks." });
        }

        return Ok(new { valid = true, message = "Payload conforms to enterprise business rules." });
    }
}
