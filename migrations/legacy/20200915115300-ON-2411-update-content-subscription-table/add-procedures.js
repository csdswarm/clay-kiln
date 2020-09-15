'use strict';

module.exports = db => Promise.all([
  db.query(makeAfterOpProcedure({ from: 'national', to: 'content' })),
  db.query(makeAfterOpProcedure({ from: 'content', to: 'national' }))
]);

/**
 * creates the function which is called
 */
function makeAfterOpProcedure({ from, to }) {
  return `
  create or replace function after_op_${from}_subscriptions()
    returns trigger as
  $body$
  begin
    if (tg_op = 'DELETE') then
      delete from ${to}_subscriptions where id = old.id;
    elsif (tg_op = 'INSERT') then
      insert into ${to}_subscriptions(short_desc, station_slug, last_updated_utc, filter, mapped_sectionfronts, from_station_slug)
      values(new.short_desc, new.station_slug, new.last_updated_utc, new.filter, new.mapped_sectionfronts, new.from_station_slug);
    elsif (tg_op = 'UPDATE') then
      update ${to}_subscriptions
      set short_desc = new.short_desc,
        station_slug = new.station_slug,
        last_updated_utc = new.last_updated_utc,
        filter = new.filter,
        mapped_sectionfronts = new.mapped_sectionfronts,
        from_station_slug = new.from_station_slug
      where id = new.id;
    end if;
    return null;
  end;
  $body$
  language plpgsql
  `;
}
