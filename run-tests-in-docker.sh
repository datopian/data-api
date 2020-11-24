#!/bin/bash

# This script imitates how the tests will be run on dockerhub
# you can run to see the test execution in docker container locally

docker-compose -f docker-compose.test.yml -p datopian-data-api-test up --exit-code-from sut --renew-anon-volumes --build && \
docker-compose -f docker-compose.test.yml -p datopian-data-api-test rm -fsv
