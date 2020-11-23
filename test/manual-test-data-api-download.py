#!/usr/bin/env python
# coding: utf-8
"""
This file is for manual testing purposes only.
Usage:

1. modify the base url for the data-api download endpoint to test
2. modify the GraphQL query QUERY

run and check the output
"""

import os, sys
import http
import urllib3
import json
import html


BASE_URL = "http://localhost:3000/v1/download"

QUERY = """
query MyQuery {
  test_table(limit: 100) {
    float_column
    int_column
    text_column
    time_column
  }
}
"""

def check_download(http, base_url, encoded_query, fmt=None, sep=None):
    url = base_url 
    if fmt:
        url = url + f'?format={fmt}'
    if fmt.lower() == 'csv' and sep:
        url = url + f'&field_separator={sep}'

    response = http.request('POST', url,
                    headers={'Content-Type': 'application/json'},
                 body=encoded_query)
  
    print("URL Called: ", response.geturl())
    print("Response HEADERS: ", response.headers)
    print("Response INFO: ", response.info())
    if fmt.lower() in ['json', 'csv'] or fmt is None:
     print(response.data.decode("utf-8"))
    

def main():
    http = urllib3.PoolManager()
    encoded_query = json.dumps({"query": QUERY})
    # json by default with no param
    check_download(http, BASE_URL, encoded_query)
    # json specifying the param
    check_download(http, BASE_URL, encoded_query, fmt='json')
    check_download(http, BASE_URL, encoded_query, fmt='xlsx')
    # csv basic 
    check_download(http, BASE_URL, encoded_query, fmt='csv')
    # csv by semicolon
    check_download(http, BASE_URL, encoded_query, fmt='csv', sep=';')
    # csv by pipe
    check_download(http, BASE_URL, encoded_query, fmt='csv', sep='|')


if __name__ == '__main__':
    main()
