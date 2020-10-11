# DBSheets

DBSheets is a simple in-memory query engine that allows you to retrieve filter, project and join data coming from
MongoDB and PostgreSQL data sources.

## Configuration

In the `etc/config.yml' file you can configure multiple connections to databases that you will reuse within the "sheets".

*example:*

```yaml
datasources:
    mongo1:
        url: mongodb://localhost
    postgres1:
        host: '127.0.0.1'
        database: 'foobar'
        user: foobar
```

In this example we define two databases, describe their connection details and assign them the keys `mongo1` and `postgres1`.

## The Sheets

The sheets are composed of two top items:

* variables: the sheet can be parametrized with variables that are evaluated at run time. The variables block will allow you to declare which variables the program will need before executing the sheet.
* steps: the steps of the sheet, describing the operations that need to be done

### Steps

Example sheets can be found in the `sheets/` directory.
The steps can be subdivded between data sources and actions:

#### Data sources

* mongodb: a MongoDB data source
* postgres: a PostgreSQL data source
* joined: a data source that joins two existing data sources
* public: a data source that takes an existing data source, perform some adjustments on field names, and exposes it

#### Actions

* comment: prints a comment in the terminal. For debug purposes
* setVar: sets a variable

## Running

The application can run in two modes:

* command line: the output will be presented in the shell and the program will exit once the operation is finished. This is the default mode.
* server: by issuing the -S flag, a web server will be activated on port 5000. The web server allows the execution of arbitrary sheets.

All options are available in the help screen of the application.

### Docker

The simplest way to run DBSheets is using Docker.

```sh
docker run --rm -p 5000:5000 -v `pwd`/etc:/usr/src/app/etc -v `pwd`/sheets:/usr/src/app/sheets -ti theirish81/dbsheets [args]
```

where `pwd`, if you're not a *Nix user, is the current directory. `[args]` is a place holder for command line arguments. Leave it empty to see the `help`.

If you're a *Nix user, the script `run.sh` will do exactly this for you.
