# AI Financial Agent
This is a proof of conncept AI financial agent.  The goal of this project is to explore the use of AI for investment research.  This project is for **educational** purposes only and is not intended for real trading or investment.

![Screenshot 2024-12-29 at 2 15 00 PM](https://github.com/user-attachments/assets/c91c67f8-e827-49cc-8813-ac5063443f36)


## Disclaimer

This project is for **educational and research purposes only**.

- Not intended for real trading or investment
- No warranties or guarantees provided
- Past performance does not indicate future results
- Creator assumes no liability for financial losses
- Consult a financial advisor for investment decisions

By using this software, you agree to use it solely for learning purposes.

## Table of Contents
- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [Financial Data](#financial-data)
- [Deploy Your Own](#deploy-your-own)

## Features
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports OpenAI (default), Anthropic, Cohere, and other model providers
- [Financial Datasets API](https://financialdatasets.ai)
  - Access to real-time and historical stock market data
  - Data is optimized for AI financial agents
  - 30+ years of financial data with 100% market coverage
  - Documentation available [here](https://docs.financialdatasets.ai)
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility


## Setup

You will need to use the environment variables [defined in `.env.example`](.env.example) to run the AI Financial Agent. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`


## Usage

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Financial Data

This template uses the [Financial Datasets API](https://financialdatasets.ai) as the financial data provider.  The Financial Datasets API is specifically designed for AI financial agents and LLMs.

The Financial Datasets API provides real-time and historical stock market data and covers 100% of the US market over the past 30 years.  

Data includes financial statements, stock prices, options data, insider trades, institutional ownership, and much more.  You can learn more about the API via the documentation [here](https://docs.financialdatasets.ai).

> Note: Data is free for AAPL, GOOGL, MSFT, NVDA, and TSLA.

If you do not want to use the Financial Datasets API, you can easily switch to another data provider by modifying a few lines of code.

## Deploy Your Own

You can deploy your own version of the Financial Agent in production via Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvirattt%2Fai-financial-agent&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-financial-agent%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Financial%20Agent&demo-description=An%20open-source%20financial%20agent%20chat%20template%20built%20with%20the%20AI%20SDK%20by%20Vercel%20and%20Financial%20Datasets%20API.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])


