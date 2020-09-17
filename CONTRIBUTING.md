# Data API Set up

## Local development environment

1. launch bg services (postgres + hasura) (`docker-compose -p datopian-data-api up -d --build`)
2. `cp .env.example .env`
3. `yarn`
4. `yarn start` to launch server / `yarn test` to run tests
5. install and use prettier to format code - https://prettier.io/docs/en/install.html (otherwise new builds will likely fail)

## CI 

Tests and redeployment run automatically on every push to master, see `.github/workflows` for more info.

Docker repository is here https://hub.docker.com/r/datopian/data-api
