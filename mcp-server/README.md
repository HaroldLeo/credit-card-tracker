# CouponCycle MCP Server

A Model Context Protocol (MCP) server that provides Claude Desktop with tools to interact with the CouponCycle credit card tracking API.

## Overview

This MCP server exposes the CouponCycle API endpoints as tools that Claude can use to:
- Search for credit cards by name, issuer, or benefits
- Browse available predefined cards
- Get detailed benefit information
- Perform advanced filtered searches
- Check API health status

**All tools are fully functional** - The search endpoints query public predefined card data and do not require authentication.

## Prerequisites

1. **CouponCycle app must be running locally**
   ```bash
   # In the main credit-card-tracker directory
   npm run dev
   ```
   The app should be accessible at `http://localhost:3000`

2. **Node.js** (v20 or higher)

## Installation

1. Navigate to the MCP server directory:
   ```bash
   cd mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

### Option 1: Claude Desktop (Recommended)

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "coupon-cycle": {
      "command": "node",
      "args": [
        "/absolute/path/to/credit-card-tracker/mcp-server/build/index.js"
      ],
      "env": {
        "COUPONCYCLE_API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/credit-card-tracker` with the actual absolute path to your repository.

### Option 2: Custom API URL

If your CouponCycle app runs on a different port or host, set the `COUPONCYCLE_API_URL` environment variable:

```json
{
  "mcpServers": {
    "coupon-cycle": {
      "command": "node",
      "args": [
        "/absolute/path/to/credit-card-tracker/mcp-server/build/index.js"
      ],
      "env": {
        "COUPONCYCLE_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

## Available Tools

### 1. `search_credit_cards`

Search for credit cards by name, issuer, or benefits.

**Parameters:**
- `query` (required): Search query text
- `limit` (optional): Max results (1-100, default: 20)
- `sortBy` (optional): Sort by "relevance", "name", "issuer", or "annualFee" (default: "relevance")
- `minScore` (optional): Minimum relevance score (0-100, default: 10)

**Example usage in Claude:**
```
Search for travel credit cards with good rewards
```

### 2. `get_predefined_cards`

Get all 50+ predefined credit cards in the database.

**Parameters:** None

**Example usage in Claude:**
```
Show me all available credit cards
```

### 3. `get_predefined_cards_with_benefits`

Get all predefined cards with complete benefit details.

**Parameters:** None

**Example usage in Claude:**
```
Get all credit cards with their benefits
```

### 4. `get_card_benefits`

Get detailed benefits for a specific card.

**Parameters:**
- `cardName` (required): Exact name of the card

**Example usage in Claude:**
```
Show me the benefits for Chase Sapphire Reserve
```

### 5. `advanced_card_search`

Advanced search with filters.

**Parameters:**
- `query` (required): Search query text
- `issuer` (optional): Filter by issuer (e.g., "Chase", "American Express")
- `minAnnualFee` (optional): Minimum annual fee
- `maxAnnualFee` (optional): Maximum annual fee
- `benefitCategories` (optional): Array of benefit categories
- `includeBenefits` (optional): Include full benefit details (default: false)
- `limit` (optional): Max results (default: 20)

**Example usage in Claude:**
```
Find Chase cards with annual fee under $100 that have travel benefits
```

### 6. `check_api_health`

Check if the CouponCycle API is running and healthy.

**Parameters:** None

**Example usage in Claude:**
```
Check if the CouponCycle API is working
```

## Usage Workflow

1. **Start CouponCycle app:**
   ```bash
   # In main credit-card-tracker directory
   npm run dev
   ```

2. **Restart Claude Desktop** (to load the MCP server)

3. **Ask Claude to use the tools:**
   - "Search for credit cards with cashback rewards"
   - "What are the best travel cards?"
   - "Show me Chase Sapphire Reserve benefits"
   - "Find cards with no annual fee"

## Development

### Build
```bash
npm run build
```

### Watch mode (auto-rebuild on changes)
```bash
npm run watch
```

### Testing the server manually
```bash
npm start
```

Note: The server uses stdio transport, so it won't show interactive output. It's designed to be controlled by Claude Desktop.

## Troubleshooting

### "Failed to connect to CouponCycle API"

**Solution:** Make sure the CouponCycle app is running:
```bash
cd /path/to/credit-card-tracker
npm run dev
```

Verify it's accessible at http://localhost:3000

### "MCP server not showing in Claude Desktop"

**Solutions:**
1. Check that the path in `claude_desktop_config.json` is absolute (not relative)
2. Verify the build directory exists: `mcp-server/build/index.js`
3. Restart Claude Desktop completely (quit and reopen)
4. Check Claude Desktop logs for errors

### "Tool execution failed"

**Solutions:**
1. Run `check_api_health` tool to verify the API is accessible
2. Check that the Next.js dev server is running without errors
3. Verify environment variables are set correctly

## Architecture

```
┌─────────────────┐
│  Claude Desktop │
└────────┬────────┘
         │ MCP Protocol (stdio)
         ↓
┌─────────────────┐
│   MCP Server    │
│  (this tool)    │
└────────┬────────┘
         │ HTTP Requests
         ↓
┌─────────────────┐
│   Next.js API   │
│  localhost:3000 │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Database     │
│  (PostgreSQL)   │
└─────────────────┘
```

## Security Notes

- This MCP server only works with a **local** CouponCycle instance
- **Search endpoints are public** - They query predefined cards (reference data) which don't require authentication
- User-specific endpoints (like `/api/user-cards`) still require authentication and are not exposed by this MCP server
- For future user-specific operations, you would need to add session/auth token handling
- Currently focuses on public endpoints (search, predefined cards, health checks)

## Future Enhancements

- [ ] Add authentication support for user-specific endpoints
- [ ] Implement caching for frequently accessed data
- [ ] Add tools for user card management (requires auth)
- [ ] Support for benefit tracking and notifications
- [ ] Export/import functionality

## License

MIT

## Support

For issues or questions:
1. Check the main CouponCycle [AGENTS.md](../AGENTS.md) for troubleshooting
2. Verify the Next.js dev server logs for API errors
3. Open an issue in the main repository
