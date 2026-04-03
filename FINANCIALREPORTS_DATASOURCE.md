# Data Source Suggestion: FinancialReports.eu for Global Equity Research

## Overview

[FinancialReports.eu](https://financialreports.eu) provides API access to **14M+ filings** from data sources across 30+ countries. Its Markdown endpoint delivers LLM-ready text from annual reports — a natural fit for ai-financial-agent's LLM-powered equity research pipeline.

## Why This Fits

ai-financial-agent does LLM-powered equity research, currently focused on US markets. FinancialReports.eu extends this to:

- **Global filing coverage** — 30+ countries including UK, EU, Japan, South Korea, Switzerland, and more
- **Markdown endpoint** — `GET /filings/{id}/markdown/` returns clean text from annual report PDFs, ready for LLM analysis
- **33,000+ companies** with ISIN, LEI, and GICS classification
- **11 standardized categories** — Financial Reporting, ESG, M&A, Debt/Equity, and more
- **Predicted report dates** — `GET /companies/{id}/next-annual-report/` for upcoming filing alerts

## Integration Approaches

### 1. Filing Research Tool

Add as a tool the agent can call for filing data:

```python
import requests

headers = {"X-API-Key": "your-api-key"}

# Search for a European company
resp = requests.get("https://api.financialreports.eu/companies/",
    headers=headers,
    params={"search": "Novo Nordisk", "page_size": 5}
)

# Fetch annual reports
resp = requests.get("https://api.financialreports.eu/filings/",
    headers=headers,
    params={
        "company_isin": "DK0062498333",  # Novo Nordisk
        "categories": "2",               # Financial Reporting
        "page_size": 5
    }
)

# Get filing as Markdown for LLM analysis
filing_id = resp.json()["results"][0]["id"]
content = requests.get(
    f"https://api.financialreports.eu/filings/{filing_id}/markdown/",
    headers=headers
).text

# Feed into LLM for equity research...
```

### 2. MCP Server Integration

FinancialReports.eu offers an [MCP server](https://financialreports.eu) compatible with Claude.ai — the agent could connect via MCP to query filings interactively.

### 3. Python SDK

```bash
pip install financial-reports-generated-client
```

```python
from financial_reports_client import Client
from financial_reports_client.api.filings import filings_list, filings_markdown_retrieve

client = Client(base_url="https://api.financialreports.eu")
client = client.with_headers({"X-API-Key": "your-api-key"})

filings = filings_list.sync(client=client, company_isin="DK0062498333", categories="2")
content = filings_markdown_retrieve.sync(client=client, id=filings.results[0].id)
```

## API Details

| Property | Value |
|---|---|
| **Base URL** | `https://api.financialreports.eu` |
| **API Docs** | [docs.financialreports.eu](https://docs.financialreports.eu/) |
| **Authentication** | API key via `X-API-Key` header |
| **Python SDK** | `pip install financial-reports-generated-client` |
| **Rate Limiting** | Burst limit + monthly quota |
| **Companies** | 33,230+ |
| **Total Filings** | 14,135,359+ |
| **Coverage** | 30+ countries |
