#!/bin/bash
docker-compose -f docker-compose.test.yml -p datopian-data-api up -d --build
