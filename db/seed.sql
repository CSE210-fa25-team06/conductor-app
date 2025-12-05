--
-- File: db/seed.sql
-- Description: DEPRECATED. This file is no longer the source of truth for seeding.
-- Use the db-seeder.js seeder to ensure ID sequences and JSON configs are respected.
--

DO $$
BEGIN
    RAISE NOTICE '*************************************************************************';
    RAISE NOTICE '* *';
    RAISE NOTICE '* STOP! THIS FILE IS DEPRECATED.                                      *';
    RAISE NOTICE '* *';
    RAISE NOTICE '* Running this raw SQL file causes ID sequence conflicts and          *';
    RAISE NOTICE '* overwrites valid configuration data.                                *';
    RAISE NOTICE '* *';
    RAISE NOTICE '* PLEASE RUN THE AUTOMATED SEEDER INSTEAD:                            *';
    RAISE NOTICE '* *';
    RAISE NOTICE '* $ node db/db-seeder.js                                              *';
    RAISE NOTICE '* *';
    RAISE NOTICE '*************************************************************************';
END $$;