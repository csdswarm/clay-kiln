'use strict';

module.exports = db => Promise.all([
  db.query(makeTrigger('content')),
  db.query(makeTrigger('national'))
]);

function makeTrigger(table) {
  return `
    create trigger after_op_${table}_subscriptions
    after delete or insert or update on ${table}_subscriptions
    for each row
    when (pg_trigger_depth() < 1)
    execute procedure after_op_${table}_subscriptions();
  `;
}
