#! /bin/bash
source ../migration-utils.sh

logMigrationDivider "Begin Event Migration"
setClayEnvironment $1
importPageFromYaml "./_pages.yml"
logMigrationDivider "End Event Migration"