-- Add aliases column to projects table for smart parsing shorthand lookups
ALTER TABLE projects ADD COLUMN aliases TEXT[];
