-- Global city autocomplete (WHERE name LIKE 'Zur%') can't use (countryId, name),
-- so the name gets its own index. See docs/queries.sql for the EXPLAIN.
-- CreateIndex
CREATE INDEX `City_name_idx` ON `City`(`name`);
