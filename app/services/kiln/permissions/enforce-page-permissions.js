'use strict';

const _get = require('lodash/get');

const actionToEnforceFn = {
  'add-component': enforceAddComponent,
  'remove-component': enforceRemoveComponent
};

function enforceAddComponent() {
  document.getElementById('vue-app-mount-point')
    .children[0].classList.add('cannot-add-component');
}

function enforceRemoveComponent() {
  document.getElementById('vue-app-mount-point')
    .children[0].classList.add('cannot-remove-component');
}

function enforcePagePermissions(schema) {
  const pagePermissions = _get(schema, '_pagePermissions'),
    { user } = window.kiln.locals;

  if (!pagePermissions) {
    return;
  }

  for (const [action, enforceFn] of Object.entries(actionToEnforceFn)) {
    const target = pagePermissions[action];

    if (target && !user.can(action).a(target).value) {
      enforceFn();
    }
  }
}

module.exports = enforcePagePermissions;
