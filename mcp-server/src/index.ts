#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * CouponCycle MCP Server
 *
 * This MCP server provides tools to interact with the CouponCycle credit card
 * tracking application running locally at http://localhost:3000
 *
 * Prerequisites:
 * - CouponCycle app must be running locally (npm run dev)
 * - App should be accessible at http://localhost:3000
 */

const API_BASE_URL = process.env.COUPONCYCLE_API_URL || "http://localhost:3000/api";

interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Make an API request to the local CouponCycle server
 */
async function makeApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to connect to CouponCycle API at ${url}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Define available MCP tools
 */
const tools: Tool[] = [
  {
    name: "search_credit_cards",
    description: `Search for credit cards by name, issuer, or benefits. Returns matching cards with relevance scores.

Examples:
- Search for travel cards: "travel rewards"
- Search by issuer: "Chase"
- Search by benefit: "lounge access"
- Search specific card: "Sapphire Reserve"`,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (card name, issuer, or benefit keywords)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (1-100, default: 20)",
          default: 20,
        },
        sortBy: {
          type: "string",
          enum: ["relevance", "name", "issuer", "annualFee"],
          description: "Sort results by field (default: relevance)",
          default: "relevance",
        },
        minScore: {
          type: "number",
          description: "Minimum relevance score (0-100, default: 10)",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_predefined_cards",
    description: `Get all predefined credit cards available in the CouponCycle database (50+ cards).
    Returns cards ordered by issuer and name. Use this to browse available cards or get a complete catalog.`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_predefined_cards_with_benefits",
    description: `Get all predefined credit cards with their full benefit details.
    Each card includes complete benefit information (categories, percentages, limits, dates).
    This is comprehensive data - use for detailed analysis or card comparisons.`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_card_benefits",
    description: `Get all benefits for a specific predefined card by searching for it first.
    Use this to view detailed benefit information for a particular card after finding it via search.`,
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "Name of the card to get benefits for (must match exactly)",
        },
      },
      required: ["cardName"],
    },
  },
  {
    name: "advanced_card_search",
    description: `Advanced search with filters for issuer, annual fee range, and benefit categories.
    Use this for complex queries with multiple criteria.`,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query text",
        },
        issuer: {
          type: "string",
          description: "Filter by card issuer (e.g., 'Chase', 'American Express', 'Capital One')",
        },
        minAnnualFee: {
          type: "number",
          description: "Minimum annual fee",
        },
        maxAnnualFee: {
          type: "number",
          description: "Maximum annual fee",
        },
        benefitCategories: {
          type: "array",
          items: { type: "string" },
          description: "Filter by benefit categories (e.g., ['Travel', 'Dining'])",
        },
        includeBenefits: {
          type: "boolean",
          description: "Include full benefit details in results (default: false)",
          default: false,
        },
        limit: {
          type: "number",
          description: "Maximum results (default: 20)",
          default: 20,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "check_api_health",
    description: `Check the health status of the CouponCycle API.
    Returns database status, memory usage, and environment information.
    Use this to verify the API is running and accessible.`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Initialize and start the MCP server
 */
const server = new Server(
  {
    name: "coupon-cycle-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle tool list requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_credit_cards": {
        const { query, limit = 20, sortBy = "relevance", minScore = 10 } = args as {
          query: string;
          limit?: number;
          sortBy?: string;
          minScore?: number;
        };

        const params = new URLSearchParams({
          q: query,
          type: "hybrid",
          limit: limit.toString(),
          sortBy,
          minScore: minScore.toString(),
        });

        const results = await makeApiRequest(`/search?${params.toString()}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "get_predefined_cards": {
        const cards = await makeApiRequest("/predefined-cards");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cards, null, 2),
            },
          ],
        };
      }

      case "get_predefined_cards_with_benefits": {
        const cards = await makeApiRequest("/predefined-cards-with-benefits");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cards, null, 2),
            },
          ],
        };
      }

      case "get_card_benefits": {
        const { cardName } = args as { cardName: string };

        // First get all cards with benefits, then filter
        const cards = await makeApiRequest("/predefined-cards-with-benefits");
        const matchedCard = cards.find(
          (card: any) => card.name.toLowerCase() === cardName.toLowerCase()
        );

        if (!matchedCard) {
          return {
            content: [
              {
                type: "text",
                text: `Card not found: "${cardName}". Use search_credit_cards to find the correct card name.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(matchedCard, null, 2),
            },
          ],
        };
      }

      case "advanced_card_search": {
        const {
          query,
          issuer,
          minAnnualFee,
          maxAnnualFee,
          benefitCategories,
          includeBenefits = false,
          limit = 20,
        } = args as {
          query: string;
          issuer?: string;
          minAnnualFee?: number;
          maxAnnualFee?: number;
          benefitCategories?: string[];
          includeBenefits?: boolean;
          limit?: number;
        };

        const filters: any = {};
        if (issuer) filters.issuer = issuer;
        if (minAnnualFee !== undefined || maxAnnualFee !== undefined) {
          filters.annualFee = {};
          if (minAnnualFee !== undefined) filters.annualFee.min = minAnnualFee;
          if (maxAnnualFee !== undefined) filters.annualFee.max = maxAnnualFee;
        }
        if (benefitCategories && benefitCategories.length > 0) {
          filters.benefitCategories = benefitCategories;
        }

        const body = {
          query,
          filters,
          options: {
            limit,
            includeBenefits,
            sortBy: "relevance",
          },
        };

        const results = await makeApiRequest("/search", {
          method: "POST",
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "check_api_health": {
        const health = await makeApiRequest("/monitoring/health");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("CouponCycle MCP Server running on stdio");
  console.error(`API URL: ${API_BASE_URL}`);
  console.error("Available tools:", tools.map(t => t.name).join(", "));
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
