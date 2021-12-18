## Fruitie

It is source code for Telegram bot that fetched reddit media potsts, follow these steps to deploy it heroku.

### Requirements
- NodeJS runtime (Heroku, raliway or other free solutions work)
- Telegram account

### Steps
- Clone this repo and push to heroku, instruction on how to push to heroku are displayed when you create a new heroku project.
Ex:
```bash
heroku git:remote -a <project_name>
git push heroku master # You may need --force
```

- Create a bot in Telegram using @botfather and note token, it will be required
- Create env variables in heroku, refer .env.example for all variables, `APP_KEY` is random key (Not needed by project but required by backend framework so fill anything)
- Set webhook endpoint to your heroku URL using the following curl, don't forget updating `<your_telegram_bot_token>` and `<project_name>` with you project name if you use heroku, replace entire URL in case of other provider

```bash
curl --location --request POST 'https://api.telegram.org/bot<your_telegram_bot_token>/setwebhook' \
--header 'Content-Type: application/json' \
--data-raw '{
    "url": "https://<project_name>.herokuapp.com/api/webhook/telegram"
}'
```

### Deploying to Heroku using Github actions

- Get heroku API Key from https://dashboard.heroku.com/account
- Set `HEROKU_API_KEY` in respository secrets at `https://github.com/{username}/{repo}/settings/secrets/actions`
- Set `HEROKU_APP_NAME` in repository secrets, App name is unique name that is also used in URL.
- Set `HEROKU_EMAIL` in repository secrets.


### Extra
Bot also support /i <instagram_username> but Instagram seems to be blocking heroku IPs so it doesn't work but code is there and it should work on a private IP VPS.