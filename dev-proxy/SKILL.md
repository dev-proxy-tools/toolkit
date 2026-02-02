---
name: dev-proxy
description: Configures Dev Proxy for API simulation, mocking, and error testing. Use when creating devproxyrc.json or devproxyrc.jsonc files, configuring Dev Proxy plugins, setting up API mocks, simulating rate limits or errors, or any task involving Dev Proxy configuration.
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
