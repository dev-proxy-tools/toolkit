---
name: dev-proxy
description: Configures Dev Proxy for API simulation, mocking, and error testing. Use when creating devproxyrc.json or devproxyrc.jsonc files, configuring Dev Proxy plugins, setting up API mocks, simulating rate limits or errors, or any task involving Dev Proxy configuration.
---

# Dev Proxy

Dev Proxy is an API simulator for testing apps beyond the happy path — error handling, rate limits, slow responses, mock APIs.

## Get Installed Version

Run `devproxy --version` to determine the installed version. Use this to set the correct `$schema` version in configuration files.

## Search Documentation

Query the docs API for specific topics:

```http
POST https://devproxy-wama.azurewebsites.net/api/search
Content-Type: application/json

{"query": "your search term"}
```

## Configuration Best Practices

### File Structure

- Configuration file: `devproxyrc.json` or `devproxyrc.jsonc` (with comments)
- Store all Dev Proxy files in `.devproxy/` folder in workspace
- Include `$schema` property — version must match installed Dev Proxy version
- If project has existing Dev Proxy files, match their schema version
- Order: `plugins` first, then `urlsToWatch`, then plugin config sections

### URLs to Watch

- Put most specific URLs first — Dev Proxy matches in order
- Prefix with `!` to exclude a URL
- Use `*` wildcard for patterns
- Prefer global `urlsToWatch` over plugin-specific `urlToWatch`
- Plugins inherit global `urlsToWatch` — only override when needed
- If plugin has no `urlsToWatch`, at least one global `urlToWatch` required

### Plugins

- Use the docs search to verify plugin exists and get current configuration
- Plugin order matters — execute in listed order
- Plugins simulating responses go last, before reporters
- Include `$schema` in plugin config sections
- Use multiple instances of same plugin for different scenarios (e.g., latency for LLM vs regular API)
- Use clear names for each plugin's config section
- Reporter plugins always last
- For throttling: put `RetryAfterPlugin` first to verify client backoff

### Mocking

- Put entries with longest/most specific URLs first
- Mocks with `nth` property defined first (more specific)
- Use `@dynamic` for dynamic `Retry-After` header values
- Use `LatencyPlugin` for realistic response timing — put it before other plugins

### File Paths

- Paths in config files are relative to the file where defined

### curl Commands

Include `-ikx http://127.0.0.1:8000` to use Dev Proxy:
```bash
curl -ikx http://127.0.0.1:8000 https://jsonplaceholder.typicode.com/posts/1
```
