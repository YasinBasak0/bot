
# [Qbot](https://qbot.com.tr) — The Virtual Assistant platform

[![CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiNTZoU0wzRmRQd29iWTFqVjliUzlvN0gzUUtoN25QVHlHMUhWYkZCWHpPQ3ZKQzFOMFh6Wm5EcHkxQW5SUmJuTFpLSDJXdURDVzNtRjM5d1BaU2pNUHhJPSIsIml2UGFyYW1ldGVyU3BlYyI6Iitoa0RBM091SnlXNTJwK2MiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://console.aws.amazon.com/codesuite/codebuild/projects/botpress-ce-tests/history?region=us-east-1)

Qbot is an open-source all-in-one bot creation platform that provides all the tools you need to build, debug and deploy AI-based conversational assistants. Built-in channels include:

- Facebook Messenger
- Slack
- Microsoft Teams
- Twilio
- Skype
- Website (Webchat)
- Telegram

Qbot Bot is:

- Developer-focused
- Natural Language Understanding (NLU)
- Built-in graphical interface & flow editor
- Administration panel and bot management tools
- Runs fully on-prem (control your data)
- Support multiple messaging channels such as Webchat, SMS, Telegram, Facebook Messenger etc

---

##### Learn Botpress

| 📖 [**Documentation**]() | 🍿 [**Tutorials**]() | 💘 [**Community Forum**]() |
| ------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |

## Deploy using Binaries

You can download the binaries [here](http://10.0.10.10/bot/bot/-/archive/master/bot-master.zip).

## Building from source

**Prerequisites**: Node 12.13 (you can use [nvm](https://github.com/creationix/nvm)) and Yarn.

1. Run `yarn` to fetch node packages.
1. Run `yarn build` to build the core, the UI and the modules.
1. Run `yarn start` to start the server.

<details><summary><strong>Building Issues</strong></summary>
<p>

If you encounter errors when building modules (timeout, random errors, etc), try the following:

1. Go in each module folder and type `yarn && yarn build`

</p>
</details>
