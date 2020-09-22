# Data API

For data management systems including [CKAN](https://ckan.org/).

## Features

- GraphQL endpoint
- Bulk export of data to json/csv/xlsx files
- `datastore_search` endpoint (similar to [CKAN Datastore extention](https://docs.ckan.org/en/latest/maintaining/datastore.html))

## Version

The current version is **v1**

**APP_VERSION** = 'v1'

## Usage

### Endpoints

- /{APP_VERSION}/graphql
- /{APP_VERSION}/datastore_search
- /{APP_VERSION}/datastore_search/help

### GraphQL Endpoint

GraphQL Endpoint exposes the hasura GraphQL API.

### datastore_search endpoing

#### Parameters

- **resource_id** (string) – _MANDATORY_ id or alias of the resource to be searched against
- **q** (string or dictionary) – JSON format query restrictions {“key1”: “a”, “key2”: “b”}, it’ll search on each specific field (optional)
- **distinct_on** [bool || list of field names] – If True: return only distinct rows, if list of fields will return only
- **limit (int)** – Maximum number of rows to return (optional, default: 100)
- **offset (int)** – offset this number of rows (optional)
- **fields (list of strings)** – fields to return (optional, default: all fields)
- ~~sort (string) – comma separated field names with ordering e.g.: “fieldname1, fieldname2 desc”~~ Not implemented yet
- ~~filters (dictionary) – matching conditions to select, e.g {“key1”: “a”, “key2”: “b”} (optional)~~ Not implemented - similar to **q**

#### Results:

The result is a JSON document containing:

- **schema** (JSON) – The data schema
- **data** (JSON) – matching results in JSON format
- ~~fields (list of dictionaries) – fields/columns and their extra metadata~~ Not Implemented
- ~~offset (int) – query offset value~~ Not implemented
- ~~total (int) – number of total matching records~~ Not implemented

## Examples

### Help page

![Help Page](documentation/help-screen.png)

### Basic query with limit

With a test table having the following schema:

![Test page](documentation/test-table-schema.png)

We can make different queries:

#### Query Table

![Query Table](documentation/query-table.png)

#### Query Table with Limit

![Query Table Limit](documentation/query-table-limit.png)

#### Query Table with Limit and Offset (pagination)

![Query Table Limit Offset](documentation/query-table-limit-offset.png)
