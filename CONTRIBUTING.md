# Data API Set up

## Local development environment

1. launch bg services (postgres + hasura) (`docker-compose -p datopian-data-api up -d --build`)
2. `cp .env.example .env`
3. `yarn`
4. `yarn start` to launch server / `yarn test` to run tests
5. install and use prettier to format code - https://prettier.io/docs/en/install.html (otherwise new builds will likely fail)

Please don't forget to put variables to `.env.example` - they also will be used in ci tests.

## CI

### Tests

Tests and formating check and run automatically on every push and pull request to master. They run on Docker hub. See documentation here https://docs.docker.com/docker-hub/builds/automated-testing/

To simulate tests as running on dockerhub you can run `run-docker-compose-test.sh` file.

If a pull request has failed checks it shows an error message in GitHub. The link to DockerHub does not work though.
You will need to navigate there:

- Docker repository is here https://hub.docker.com/repository/docker/datopian/data-api
- To see build jobs go to builds https://hub.docker.com/repository/docker/datopian/data-api/builds and find your build/test

### Docker image builds

After every push to master and successful tests there is a new docker image built here https://hub.docker.com/repository/docker/datopian/data-api/builds
