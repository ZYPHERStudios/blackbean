<div align="center">
  <img src="https://raw.githubusercontent.com/ZYPHERStudios/blackbean/refs/heads/main/src/img/logo.png" width="72" height="72" />
  <h1>blackbean</h1>
  <br>
<a href="https://www.typescriptlang.org/"><img src="https://colbster937.github.io/devins-badges/assets/cozy/built-with/typescript_vector.svg"></a>
<a href="https://pptr.dev/"><img src="https://colbster937.github.io/devins-badges/assets/cozy/built-with/puppeteer_vector.svg"></a>
<br>
<a href="https://github.com/ZYPHERStudios/blackbean/"><img src="https://colbster937.github.io/devins-badges/assets/cozy/available/github_vector.svg"></a>
<a href="https://www.npmjs.com/package/blackbean"><img src="https://colbster937.github.io/devins-badges/assets/cozy/available/npm_vector.svg"></a>
  <h1> </1>
</div>
<br>

> [!CAUTION]
> **ZYPHER Studios is not responsible for any consequences resulting from the use of this tool. Use at your own risk.**

## About
blackbean is an automated, AI-powered bot for completing Membean sessions using
browser automation and intelligent answer selection.

## Features
- [x] Supports all Membean question types
- [x] Fully configurable behavior and accuracy
- [x] Command-line driven interface
- [x] Designed to minimize detection
- [x] Multiple authentication types
- [ ] GUI for session management

## Requirements
- NodeJS v18 or newer
- A modern CPU with decent single-core performance (for image recognition)
- Stable internet connection

## Usage

**CLI:**
```sh
# package
$ npm install -g blackbean
$ blackbean --auth-method membean --email your.email@example.com --password password1234! --length 15 --accuracy 90

# source
$ git clone https://github.com/ZYPHERStudios/blackbean.git
$ npm install
$ npm run start -- --auth-method membean --email your.email@example.com --password password1234! --length 15 --accuracy 90
```

**GUI:**
*coming soon!*

## Configuration

| Name | Enviroment | Default | Type | Required |
| :-: | :-: | :-: | :-: | :-: |
| auth-method | AUTH_METHOD | membean | string | yes |
| email | AUTH_EMAIL | | string | yes |
| password | AUTH_PASSWD | | string | yes |
| length | SESSION_LENGTH | 15 | string | no |
| api-base | AI_API_BASE | https://api.openai.com/v1 | string | no |
| api-key | AI_API_KEY | | string | yes |
| debug | BB_DEBUG | false | boolean | no |
| silent | BB_SILENT | false | boolean | no |

## License
blackbean is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.
> Any modified version that is run as a network service must also make its source code available under the same license.