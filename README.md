# MDKP Frontend (SPA)

## Запуск

1) Укажите API:

```bash
cp .env.example .env
```

2) Установите зависимости и запустите:

```bash
npm i
npm run dev
```

По умолчанию фронт стартует на `http://localhost:5173`, API — `http://localhost:8080`.

## Установка NodeJS

# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.15.0".

# Verify npm version:
npm -v # Should print "11.12.1".

https://nodejs.org/en/download