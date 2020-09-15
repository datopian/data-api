CREATE TABLE IF NOT EXISTS test_table AS
SELECT
	generate_series AS time_column,
	md5(random()::text) AS text_column,
	random() AS float_column,
	floor(random() * 1000000 + 1)::int AS int_column
FROM generate_series('2018-01-01 00:00'::timestamp, '2020-01-01 00:00', '1 minutes');
