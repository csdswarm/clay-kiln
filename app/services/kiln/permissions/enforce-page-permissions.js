'use strict';

const _get = require('lodash/get');

const actionToEnforceFn = {
    'add-component': enforceAddComponent,
    'remove-component': enforceRemoveComponent
  },
  CANNOT_ADD_COMPONENT = 'cannot-add-component',
  CANNOT_REMOVE_COMPONENT = 'cannot-remove-component';

function enforceAddComponent() {
  document.getElementById('vue-app-mount-point')
    .children[0].classList.add(CANNOT_ADD_COMPONENT);

  document.getElementsByClassName('kiln-internals')[0]
    .classList.add(CANNOT_ADD_COMPONENT);
}

function enforceRemoveComponent() {
  document.getElementById('vue-app-mount-point')
    .children[0].classList.add(CANNOT_REMOVE_COMPONENT);
  
  document.getElementsByClassName('kiln-internals')[0]
    .classList.add(CANNOT_REMOVE_COMPONENT);
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
