'use strict';

const axios = require('axios'),
  COOKIES = {
    accessToken: 'a_id',
    profile: 'p_id'
  },
  jwt = require('jsonwebtoken'),
  moment = require('moment'),
  db = require('../server/db'),
  excludeKeys = {
    token: ['access_token', 'expires_in', 'refresh_token', 'id_token', 'device_key', 'token_type'],
    profile: ['application_id', 'created_date', 'modified_date', 'tracking_id', 'user_id', 'userId']
  },
  radiumApi = 'https://radium.radio.com/',
  radiumAxios = axios.create(),
  facebookCallbackUrL = process.env.FACEBOOK_CALLBACK_URL,
  privateKey = process.env.JWT_SECRET_KEY,
  cognitoClientId = process.env.COGNITO_CLIENT_ID,
  profileExpires = 10 * 365 * 24 * 60 * 60,
  accessExpires = 10 * 365 * 24 * 60 * 60,
  /**
   * standardized way of printing out method and url
   * @param {object} req
   * @returns {string} method:url
   */
  currentRoute = (req) => `${req.method.toUpperCase()}:${req.url}`,
  /**
   * determines if a user is attempting to log out
   * @param {object} req
   * @returns {boolean}
   */
  isLogoutRoute = req => currentRoute(req) === 'POST:/radium/v1/auth/signout',
  /**
   * Parses the device_key value from the client authToken cookie
   * @param {string} authToken the access_token from the client
   * @returns {string} The device_key value from the authToken payload
   */
  getDeviceKey = authToken => (jwt.decode(authToken) || {}).device_key,
  /**
   * determines of the response is coming from a user signed in with facebook
   * @param {object} response
   * @returns {boolean} whether or not the user is signed in with facebook
   */
  isFacebookUser = (response) => response && response.config && response.config.facebookUser,
  /**
   * decodes the cookie and verifies it is valid
   *
   * @param {string} name
   * @param {object} cookies
   * @return {*}
   */
  decodeCookie = (name, cookies) => {
    try {
      return jwt.verify(cookies[name], privateKey, { ignoreExpiration: true })['value'];
    } catch (e) {
      return null;
    }
  },
  /**
   * encode the cookie
   *
   * @param {object} data
   * @return {string}
   */
  encodeCookie = (data) => jwt.sign({ ['value']: data }, privateKey),
  /**
   * add the jwt to the response
   *
   * @param {string} name
   * @param {object} data
   * @param {int} expire
   * @param {object} response
   */
  addCookie = (name, data, expire, response) => {
    try {
      response.cookie(name, encodeCookie(data), { path: '/', httpOnly: true, expires: new Date(Date.now() + expire * 1000) });
    } catch (e) {
      console.log('Adding cookie failed:', e);
    }
  },
  /**
   * removes a cookie from the response
   *
   * @param {string} name
   * @param {object} response
   */
  deleteCookie = (name, response) => {
    addCookie(name, '', -1, response);
  },
  /**
   * returns the extracted user information stored in the cookie
   *
   * @param {object} req
   * @return {object}
   */
  userFromCookie = (req) => {
    return decodeCookie(COOKIES.profile, req.cookies);
  },
  /**
   * does the object contain the token information
   *
   * @param {object} object
   * @param {array} ignoreKeys keys to ignore when determining if token keys exist
   * @return {boolean}
   */
  hasTokenKeys = (object, ignoreKeys = []) => {
    const keys = Object.keys(object),
      tokenKeys = excludeKeys.token.filter(key => !ignoreKeys.includes(key));

    return tokenKeys.filter((key) => keys.includes(key)).length === tokenKeys.length;
  },
  /**
   * removes keys from the object
   *
   * @param {object} object
   * @param {array} keys
   * @return {object}
   */
  removeKeys = (object, keys) => keys.forEach((key) => delete object[key]),
  /**
   * obtain a new token
   *
   * @param {object} response
   * @return {boolean}
   */
  tokenExpired = (response) => response.data && Array.isArray(response.data.errors) && response.data.errors[0].status === 401,
  /**
   * obtain a new token
   *
   * @param {object} req
   * @param {object} res
   */
  refreshAuthToken = async (req, res) => {
    const profile = decodeCookie(COOKIES.profile, req.cookies),
      tokens = await db.get(`token-${profile.userId}`),
      refreshToken = tokens.refreshToken,
      authToken = decodeCookie(COOKIES.accessToken, req.cookies),
      response = await call('PUT', 'v1/auth/new_token', {
        refresh_token: refreshToken,
        access_token: authToken
      });

    // update the request object so subsequent calls will have the updated token
    req.cookies[COOKIES.accessToken] = encodeCookie(response.data.access_token);
    addCookie(COOKIES.accessToken, response.data.access_token, accessExpires, res);
  },
  /**
   * make request to url adding authorization if available
   *
   * @param {String} method
   * @param {String} url
   * @param {Object} data
   * @param {Object} [accessToken]
   * @return {Promise<Object>}
   */
  call = async (method, url, data, accessToken) => {
    const headers = {...accessToken ? {authorization: `Bearer ${accessToken}`} : {}};
     
    return await radiumAxios({
      method,
      url: `${radiumApi}${url}`,
      data,
      headers
    });
  },
  /**
   * obtain the users profile
   *
   * @param {object} tokens
   * @param {boolean} facebookUser
   * @return {Promise<Object>}
   */
  getProfile = async (tokens, facebookUser) => {
    try {
      const response = await call('GET', 'v1/profile', null, tokens.access_token);

      return {
        ...response.data,
        email: tokens.email,
        verified: tokens.verified,
        facebookUser
      };
    } catch (e) {
      // no profile stored, extract what you can from the id token
      const idProfile = jwt.decode(tokens.id_token, '', true);

      return {
        user_id: tokens.user_id,
        email: idProfile.email || '',
        first_name: idProfile.given_name || '',
        last_name: idProfile.family_name || '',
        gender: idProfile.gender ? idProfile.gender.charAt(0).toUpperCase() : '',
        date_of_birth: idProfile.birthdate ? moment(idProfile.birthdate, 'L').utc() : '',
        verified: false,
        facebookUser
      };
    }
  },
  /**
   * specific logic for create profile endpoints to add cookies to response
   *
   * @param {object} response
   * @param {object} req
   * @param {object} res
   */
  profileLogic = (response, req, res) => {
    const oldProfile = decodeCookie(COOKIES.profile, req.cookies),
      // email and verified do not come back from the profile API endpoints, so use them from the cookie
      newProfile = {...oldProfile, ...response.data};

    removeKeys(newProfile, excludeKeys.profile);
    // save the response details
    addCookie(COOKIES.profile, newProfile, profileExpires, res);
    response.data = newProfile;
  },
  /**
   * specific logic for sign in endpoint to add cookies to response
   *
   * @param {object} response
   * @param {object} req
   * @param {object} res
   */
  signInLogic = async (response, req, res) => {
    const facebookUser = isFacebookUser(response),
      ignoreTokenKeys = facebookUser ? ['device_key'] : [];

    if (hasTokenKeys(response.data, ignoreTokenKeys)) {
      // get profile for the user so it can be accessed in clay
      const profile = await getProfile(response.data, facebookUser);

      // save the response details
      addCookie(COOKIES.profile, profile, profileExpires, res);
      addCookie(COOKIES.accessToken, response.data.access_token, accessExpires, res);

      // since sending all of the tokens will be more than 4,096 bytes, store the refresh
      db.put(`token-${profile.user_id}`, JSON.stringify({
        refreshToken: response.data.refresh_token
      }));

      // return the profile along to be stored in the spa
      response.data = {
        ...response.data,
        ...profile
      };
    }

    // removes keys that should never be sent back to the browser from the object
    removeKeys(response.data, [ ...excludeKeys.token, ...excludeKeys.profile ]);
  },
  signOutLogic = async (response, req, res) => {
    deleteCookie(COOKIES.profile, res);
    deleteCookie(COOKIES.accessToken, res);
  },
  /**
   * loop through all endpoints that require specific logic to modify the response
   *
   * @param {object} response
   * @param {object} req
   * @param {object} res
   */
  routeLogic = async (response, req, res) => {
    const routes = {
        'POST:/radium/v1/auth/signin': signInLogic,
        'POST:/radium/v1/auth/signout': signOutLogic,
        'POST:/radium/v1/profile/create': profileLogic,
        'POST:/radium/v1/profile/update': profileLogic,
        'GET:/radium/v1/profile': profileLogic
      },
      keys = Object.keys(routes),
      current = `${req.method}:${req.path}`;

    if (keys.includes(current)) {
      await routes[current](response, req, res);
    }
  },
  /**
   * handle errors from applying
   *
   * @param {object} response
   * @param {function} retry
   * @param {object} req
   * @param {object} res
   */
  handleError = async (response, retry, req, res) => {
    // check to see if the authorization has expired
    if (retry(response)) {
      try {
        // refresh and then make the call again
        await refreshAuthToken(req, res);
      } catch (e) {
        deleteCookie(COOKIES.accessToken, res);
        deleteCookie(COOKIES.profile, res);
      }
      return await apply(req, res, false);
    }

    return res.status(response.status).json(response.data);
  },
  /**
   * Passthru to radium.radio.com
   *
   * @param {object} req
   * @param {object} res
   * @param {boolean} [retry]
   * @return {Promise<Object>}
   */
  apply = async (req, res, retry = true) => {
    const data = req.body,
      retryFunction = retry ? tokenExpired : () => false,
      method = req.method.toUpperCase(),
      url = req.params[0],
      authToken = decodeCookie(COOKIES.accessToken, req.cookies),
      { facebookUser } = decodeCookie(COOKIES.profile, req.cookies) || {},
      logoutRoute = isLogoutRoute(req),
      facebookLogout = facebookUser && logoutRoute;

    if (data && data.includeDeviceKey) {
      delete data.includeDeviceKey;
      // for extra security, only decode access token on server
      data.device_key = getDeviceKey(authToken);
    }

    try {
      if (facebookLogout) {
        await signOutLogic(null, req, res);
      } else {
        const response = await call(method, url, data, authToken);

        if (response.status < 400) {
          await routeLogic(response, req, res);

          return response.data;
        } else {
          await handleError(response, retryFunction, req, res);
        }
      }
    } catch (e) {
      await handleError(e.response, retryFunction, req, res);
    }
  },
  /**
   * Signin for facebook
   *
   * @param {object} req
   * @param {object} res
   * @return {Promise<Object>}
   */
  facebookCallback = async (req, res) => {
    const { code } = req.query,
      redirectUri = `https://${process.env.CLAY_SITE_HOST}/account/facebook-callback`,
      data = `code=${code}&client_id=${cognitoClientId}&redirect_uri=${redirectUri}&grant_type=authorization_code`,
      options = {
        method: 'post',
        url: facebookCallbackUrL,
        data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        crossdomain: true,
        withCredentials: true,
        facebookUser: true
      };

    return axios(options).then(async response => {
      await signInLogic(response, req, res);
      return response.data;
    }).then((data) => {
      return res.send(
        `<script>window.opener.postMessage(${JSON.stringify(data)}, location.protocol + '//' + location.hostname); window.close();</script>`
      );
    }).catch((e) => {
      console.log(e);
      res.status(500).json({message: 'An unknown error has occurred'});
    });
  };

module.exports.apply = apply;
module.exports.facebookCallback = facebookCallback;
module.exports.userFromCookie = userFromCookie;
