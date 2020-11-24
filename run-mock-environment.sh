#!/bin/bash

# Launches mock postgres and hasura from `environment` directory
# Useful for development locally

docker-compose up --build && docker-compose rm -fsv
