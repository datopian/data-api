# CKAN - New API Differences and Analysis

Here we document the differences between this new API and [CKAN]() version

By default all parameters and results from the new API are JSON, this differs from CKAN in which the get call parameters are non standard but have an ad-hoc syntax. This is to

## General Differences CKAN vs New API

The new API is entirely based on a GraphQL DB querying system, this changes the ways in which we can make queries.

CKAN targets a Postgresql DB, the difference with a GraphQL DB is that the queries that can be implemented are quite different.

GraphQL queries need to be explicit, including even the fields ("columns" in a traditional DB), which means knowing the database and _"table"_ schema before making the query to be able to ask for the needed fields. This means that for

## GET Parameters

This section discusses each CKAN parameter and its implementation (or not) in the new API;

### Parameters:

**resource_id** (string) – id or alias of the resource to be searched against. Mandatory parameter, implemented

**filters** (dictionary) – matching conditions to select, e.g {“key1”: “a”, “key2”: “b”} (optional). Optional parameter, use **q** query instead in the New API.

**q** (string or dictionary) – full text query. If it’s a string, it’ll search on all fields on each row. If it’s a dictionary as {“key1”: “a”, “key2”: “b”}, it’ll search on each specific field (optional)

This field is different in the new API, the main difference is that the new API only receives JSON. Current New API implementationis equivalent to filters. 

**distinct** (bool) – return only distinct rows (optional, default: false)

This parameter is vastly different from the previous CKAN implementation. In GraphQL there is no notion of *row* (due to the simple fact that graphs do not have rows), this means that the option distinct does not mean the same for the new API and that we can also implement a new idea. 

Due to the differences and to make it evident that the API is not the same the new implementation is called **distinct_on** and needs a list of *fields* to test for differences, so the new implementation can check for differences for each field.

The New API does also implement (for backwards compatibility) a boolean value where it will query the graph schema and ask for different in every field of the schema, which would be equivalent to the CKAN *distinct* implementation.

**plain** (bool) – treat as plain text query (optional, default: true)
**language** (string) – language of the full text query (optional, default: english)

Full text search was discussed to not be implemented in the [github issue](https://github.com/datopian/data-api/issues/7)

**limit** (int) – maximum number of rows to return (optional, default: 100, unless set in the site’s configuration ckan.datastore.search.rows_default, upper limit: 32000 unless set in site’s configuration ckan.datastore.search.rows_max)

There is no difference in the implementation of this parameter

**offset** (int) – offset this number of rows (optional)

This parameter that implies *pagination* to the response has not been completely implemented in the new API. The reason for this is that in GraphQL there are 2 different ways of implementing pagination and this needs to be analyzed more in depth.


**fields** (list or comma separated string) – fields to return (optional, default: all fields in original order)

List of fields to return to the caller. The only difference is that in the New API the input is a list (JSON)

**sort** (string) – comma separated field names with ordering e.g.: “fieldname1, fieldname2 desc”

Not included yet in the New API, and the only difference with the new api is that it will be implemented with a JSON input instead of a comma separated field names. The input parameter will have the following format:

{ fieldname1: order, fieldname2: order} where order = [asc|desc]

**include_total** (bool) – True to return total matching record count (optional, default: true)

Not Implemented in the New API, this is CPU intensive and needs an extra query or process the result to count the number of resulting elements. 

**total_estimation_threshold** (int or None) – If “include_total” is True and “total_estimation_threshold” is not None and the **estimated total** (matching record count) is above the “total_estimation_threshold” then this datastore_search will return an estimate of the total, rather than a precise one. This is often good enough, and saves computationally expensive row counting for larger results (e.g. >100000 rows). The estimated total comes from the PostgreSQL table statistics, generated when Express Loader or DataPusher finishes a load, or by autovacuum. NB Currently estimation can’t be done if the user specifies ‘filters’ or ‘distinct’ options. (optional, default: None)

This is not feasible with the current graphql DB except for the global statistics on the schema. To be able to estimate the count we would need some other aggregation statistics on the different kind of queries.


**records_format** (controlled list) – the format for the records return value: ‘objects’ (default) list of {fieldname1: value1, …} dicts, ‘lists’ list of [value1, value2, …] lists, ‘csv’ string containing comma-separated values with no header, ‘tsv’ string containing tab-separated values with no header
  Setting the plain flag to false enables the entire PostgreSQL full text search query language.

The result format in the New API is JSON, in the future and if needed another return format can be implemented


### Results:

The result returned to the caller is a JSON containing the following:

```javascript
{ 
    schema: {JSON schema definition},
    data: [JSON list of elements]

}
```

The following list shows the CKAN return elements and the implementation in the New API

* fields (list of dictionaries) – fields/columns and their extra metadata
    - This is not returned as in a JSON format it is not needed (it is already present in the return ) and the extra metadata is present in the *schema* field

* offset (int) – query offset value
    - Not currently implemented as a return value

* limit (int) – queried limit value (if the requested limit was above the ckan.datastore.search.rows_max value then this response limit will be set to the value of ckan.datastore.search.rows_max)
    - Not currently implemented as a return value

* filters (list of dictionaries) – query filters
    - Not currently implemented as a return value

* total (int) – number of total matching records
    - Not currently implemented as a return value. Needs more analysis and development to be implemented.

* total_was_estimated (bool) – whether or not the total was estimated
    - Will not implement

* records (depends on records_format value passed) – list of matching results 
    - This one now is named *data*