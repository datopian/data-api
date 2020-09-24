#!/bin/bash
docker-compose -f docker-compose.test.yml -p datopian-data-api-test up --exit-code-from sut --renew-anon-volumes --build
