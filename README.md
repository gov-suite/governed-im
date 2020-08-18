# Governed Information Model (GIM) Core

`governed-im` (GIM) is a Deno Typescript module which helps define entities, attributes, values,
graphs and related objects for generation of SQL and other storage engine artifacts.

The GIM module is designed to specify, in a storage-engine and database agnostic approach, complex
validatable polyglot capable data structures. It's based on a "specify once, generate many"
design philosophy.

It supports:

- Relational Database Management Systems (RDBMs like SQLite, PostgreSQL, and MySQL)
- NoSQL Storage Engines (like MongoDB, DynamoDB, etc.)

We want to be able to generate:

- Relational Schemas (e.g. SQLite, PostgreSQL)
- Polyglot data structure code (e.g. Typescript classes, Golang interfaces, Java classes)
- Polyglot services layers (e.g. GraphQL, React Admin Data Providers)
- ERDs and Schema documentation
- TypeGraphQL, TypeORM
- Almost any kind of code that needs complex data structures with validation

Types of generators:

- Destructive SQL (DDL, data deletions, etc.)
- Idempotent SQL (upserts, views, stored procedures, etc.)

# Structure

This is a monorepo with three related libraries that work together but are isolated for code
management purposes:

* `core`
* `transform`
* `typical`

