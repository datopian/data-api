# CKAN - New API Differences and Analysis

Here we document the differences between this new API and [CKAN]() version

By default all parameters and results from the new API are JSON, this differs from CKAN in which the get call parameters are non standard but have an ad-hoc syntax. This is to 

## General Differences CKAN vs New API

The new API is entirely based on a GraphQL DB querying system, this changes the ways in which we can make queries.

CKAN targets a Postgresql DB, the difference with a GraphQL DB is that the queries that can be implemented are quite different.

GraphQL queries need to be explicit, including even the fields ("columns" in a traditional DB), which means knowing the database and *"table"* schema before making the query to be able to ask for the needed fields. This means that for 

##  GET Parameters

This section discusses each CKAN parameter and its implementation (or not) in the new API;


### Parameters:	

* **resource_id** (string) – id or alias of the resource to be searched against.  Mandatory parameter, implemented

* **filters** (dictionary) – matching conditions to select, e.g {“key1”: “a”, “key2”: “b”} (optional). Optional parameter, implemented

* **q** (string or dictionary) – full text query. If it’s a string, it’ll search on all fields on each row. If it’s a dictionary as {“key1”: “a”, “key2”: “b”}, it’ll search on each specific field (optional)

This field is different in the new API, the difference is that the new API only receives JSON

* **distinct** (bool) – return only distinct rows (optional, default: false)



* **plain** (bool) – treat as plain text query (optional, default: true)
* **language** (string) – language of the full text query (optional, default: english)
* **limit** (int) – maximum number of rows to return (optional, default: 100, unless set in the site’s configuration ckan.datastore.search.rows_default, upper limit: 32000 unless set in site’s configuration ckan.datastore.search.rows_max)
* **offset** (int) – offset this number of rows (optional)
* **fields** (list or comma separated string) – fields to return (optional, default: all fields in original order)
* **sort** (string) – comma separated field names with ordering e.g.: “fieldname1, fieldname2 desc”
* **include_total** (bool) – True to return total matching record count (optional, default: true)
* **total_estimation_threshold** (int or None) – If “include_total” is True and “total_estimation_threshold” is not None and the  **estimated total** (matching record count) is above the “total_estimation_threshold” then this datastore_search will return an estimate of the total, rather than a precise one. This is often good enough, and saves computationally expensive row counting for larger results (e.g. >100000 rows). The estimated total comes from the PostgreSQL table statistics, generated when Express Loader or DataPusher finishes a load, or by autovacuum. NB Currently estimation can’t be done if the user specifies ‘filters’ or ‘distinct’ options. (optional, default: None)
* **records_format** (controlled list) – the format for the records return value: ‘objects’ (default) list of {fieldname1: value1, …} dicts, ‘lists’ list of [value1, value2, …] lists, ‘csv’ string containing comma-separated values with no header, ‘tsv’ string containing tab-separated values with no header
Setting the plain flag to false enables the entire PostgreSQL full text search query language.

A listing of all available resources can be found at the alias _table_metadata.

If you need to download the full resource, read Downloading Resources.

Results:

The result of this action is a dictionary with the following keys:

Return type:	
A dictionary with the following keys

Parameters:	
fields (list of dictionaries) – fields/columns and their extra metadata
offset (int) – query offset value
limit (int) – queried limit value (if the requested limit was above the ckan.datastore.search.rows_max value then this response limit will be set to the value of ckan.datastore.search.rows_max)
filters (list of dictionaries) – query filters
total (int) – number of total matching records
total_was_estimated (bool) – whether or not the total was estimated
records (depends on records_format value passed) – list of matching results