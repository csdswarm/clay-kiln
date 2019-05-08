'use strict';

const fbSdkUrl = '//connect.facebook.net/en_US/all.js#xfbml=1&amp;version=v2.3',
  /**
   * Includes the Facebook SDK on the page.
   * @param {function} callback - FB SDK <script> loaded callback.
   * @param {function} onError - FB SDK <script> error handler
   */
  mountFacebookSdk = (callback, onError) => {
    const firstScript = document.getElementsByTagName('script')[0],
      newScript = document.createElement('script');

    newScript.onload = () => {
      return callback(null);
    };
    newScript.onerror = (error) => {
      return onError(error);
    };
    newScript.src = fbSdkUrl;
    
    firstScript.parentNode.insertBefore(newScript, firstScript);
  },
  /**
   * Ensure Facebook SDK exists on the page
   * @param {function} callback - Callback after confirmation of Facebook SDK
   * @param {function} onError - Error handler if Facebook SDK cannot be loaded
   */
  ensureFBExists = (callback, onError = (error) => {throw error;}) => {
    if (window.FB) {
      callback();
    } else if (!document.querySelector(`script[src="${fbSdkUrl}"]`)) {
      mountFacebookSdk(callback, onError);
    }
  };

module.exports.ensureFBExists = ensureFBExists;
