---
name: dev-proxy
description: API simulation and testing with Dev Proxy. Use when mocking API responses, testing error handling (500s, timeouts, failures), reducing API costs during development (especially AI/LLM apps), simulating rate limits or slow responses, intercepting HTTP traffic for debugging, testing without hitting production APIs, setting up API mocks in CI/CD, generating API documentation from traffic, optimizing Microsoft Graph API calls, validating APIs against governance policies (Azure API Center), or testing MCP servers.
---

# Dev Proxy

Dev Proxy is an API simulator for testing apps beyond the happy path — error handling, rate limits, slow responses, mock APIs.

## Get Installed Version

Run `devproxy --version` to determine the installed version. Use this to set the correct `$schema` version in configuration files.

## Get Best Practices

Fetch the latest configuration best practices:

```http
GET https://aka.ms/devproxy/best-practices
```

Always retrieve and follow these best practices when creating or modifying Dev Proxy configuration files.

## Search Documentation

Query the docs API for specific topics:

```http
POST https://devproxy-wama.azurewebsites.net/api/search
Content-Type: application/json

{"query": "your search term"}
```
