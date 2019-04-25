const fs = require('fs'),
  YAML = require('../../../app/node_modules/yamljs'),
  host = process.argv.slice(2)[0],
  componentType = process.argv.slice(2)[1],
  instanceType = process.argv.slice(2)[2];

if (!host) {
  throw new Error('Missing host');
}

if (!componentType) {
  throw new Error('Missing component type.')
}

if (!instanceType) {
  throw new Error('Missing instance type.')
}

// Get current JSON
const data = require(`${__dirname}/${componentType}-${instanceType}.json`)
let branchKey = 'key_test_ddzzCUvmiEt9NNOmLuo2CecpCBcLTjEn'

if (host === 'www.radio.com') {
  branchKey = 'key_live_boErzJxoeEvYVUKoPscTOhlivAaPPik7'
}

data.text = `
<style type="text/css">
  /*
    Converted https://www.radio.com/sites/g/files/giy2536/themes/site/source/sass/objects/_about.scss using https://www.sassmeister.com/
    - New styles added for Clay compatibility are at end of file
    - Fonts were changed from ProximaNova-Regular to ProximaNova-Regular
  */

  .radiocom-subscribe {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .radiocom-subscribe .subscribe-block {
    padding: 50px 100px;
    background: #3C00B7;
    color: #FFF;
    text-align: center;
    margin-top: 5px;
    background: #3c00b7;
    background: -moz-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: -webkit-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: linear-gradient(to bottom, #3c00b7 0%, #1f055e 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#3c00b7", endColorstr="#1f055e",GradientType=0 );
    width: 100%;
  }

  .radiocom-subscribe .subscribe-form {
    margin: 20px;
    width: 480px;
  }
  @media screen and (max-width: 480px) {
    .radiocom-subscribe .subscribe-form  {
      width: 100%;
      margin: 10px;
    }
    .radiocom-subscribe .subscribe-block  {
      padding: 10px;
    }
    .radiocom-subscribe .subscribe-block p {
      margin: 10px auto;
    }
    .radiocom-subscribe .subscribe-block h1 {
      margin-bottom: 5px;
    }
  }

  .radiocom-subscribe h1 {
    color: #FFF;
    text-align: center;
    font-family: CircularStd-Black, sans-serif;
    text-transform: capitalize;
    line-height: 1.2em;
    font-size: 50px;
    margin-bottom: 25px;
  }
  .radiocom-subscribe p {
    margin: 50px auto;
    color: #FFF;
    text-align: center;
    font-family: ProximaNova-Regular, sans-serif;
    font-size: 24px;
    line-height: 1.6;
  }


  .radiocom-apps h1 {
    font-family: CircularStd-Black, sans-serif;
    color: #1F055E;
    text-transform: capitalize;
    font-size: 40px;
    line-height: 1.2em;
    margin: 0;
  }
  .radiocom-apps h3 {
    font-family: CircularStd-Black, sans-serif;
    color: #1F055E;
    text-transform: capitalize;
    font-size: 24px;
    line-height: 1.2em;
    margin: 0;
  }
  .radiocom-apps p {
    font-family: ProximaNova-Regular, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }
  .radiocom-apps span {
    font-family: ProximaNova-Regular, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }
  .radiocom-apps li {
    font-family: ProximaNova-Regular, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }
  .radiocom-apps button {
    padding: 0;
    margin: 0;
    outline: 0;
    background: transparent;
    border: 0;
  }
  .radiocom-apps button:focus {
    padding: 0;
    margin: 0;
    outline: 0;
    background: transparent;
    border: 0;
  }
  .radiocom-apps button img {
    display: inline-block;
    vertical-align: top;
  }
  .radiocom-apps a {
    display: inline-block;
    vertical-align: top;
  }
  .radiocom-apps a button {
    cursor: pointer;
  }
  .radiocom-apps .img-container img {
    width: 100%;
    height: auto;
  }
  .radiocom-apps .apps-block.download h1 {
    color: #FFF;
  }
  .radiocom-apps .apps-block.download p {
    color: #FFF;
  }
  .radiocom-apps .apps-block.download span {
    color: #FFF;
    font-size: 15px;
    margin-top: 20px;
    display: inline-block;
    vertical-align: top;
  }

  .apps-block {
    display: block;
    background: #FAFAFA;
    width: 100%;
    height: auto;
    padding: 50px 15%;
  }

  .apps-block.cta {
    text-align: center;
  }
  .apps-block.cta h1 {
    color: #FFF;
  }
  .apps-block.cta h3 {
    color: #FFF;
  }
  .apps-block.cta span {
    color: #FFF;
  }

  .apps-block.top-banner {
    background: #1f055e;
    background: -moz-linear-gradient(top, #1f055e 0%, #3c00b7 100%);
    background: -webkit-linear-gradient(top, #1f055e 0%, #3c00b7 100%);
    background: linear-gradient(to top, #1f055e 0%, #3c00b7 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#1f055e", endColorstr="#3c00b7",GradientType=0 );
    display: flex;
    overflow: hidden;
  }
  .apps-block.top-banner h1 {
    text-transform: uppercase;
  }
  .apps-block.top-banner span {
    font-family: ProximaNova-Regular, sans-serif;
    margin: 30px auto;
  }
  .apps-block.top-banner h3 {
    margin-bottom: 30px;
  }
  .apps-block.top-banner .img-container {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    width: 40%;
  }
  .apps-block.top-banner .img-container img {
    margin-bottom: -80%;
  }
  .apps-block.top-banner .cta {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    width: 60%;
    padding: 0 0 0 50px;
  }

  .apps-block.top-banner.cta button {
    height: 73px;
    width: auto;
  }
  .apps-block.top-banner.cta button img {
    height: 100%;
    width: auto;
  }
  .apps-block.top-banner.cta a:first-of-type button {
    margin-right: 30px;
  }

  .apps-block.features {
    display: flex;
    padding: 100px 15.6%;
  }
  .apps-block.features button {
    height: 73px;
    width: auto;
  }
  .apps-block.features button img {
    height: 100%;
    width: auto;
  }
  .apps-block.features a:first-of-type button {
    margin-right: 30px;
  }
  .apps-block.features .description {
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 75%;
    padding: 0 100px 0 0;
  }
  .apps-block.features .description h1 {
    text-transform: initial;
  }
  .apps-block.features .description ul {
    margin: 0;
  }
  .apps-block.features .description .buttons {
    margin-top: 30px;
  }
  .apps-block.features .img-container {
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 25%;
  }

  .apps-block.download {
    background: #3C00B7;
    padding: 50px 26%;
  }
  .apps-block.download button {
    height: 73px;
    width: auto;
  }
  .apps-block.download button img {
    height: 100%;
    width: auto;
  }
  .apps-block.download a:first-of-type button {
    margin-right: 30px;
  }

  .apps-block.newsletter {
    background: #1F055E;
    padding: 50px 20%;
  }
  .apps-block.newsletter button {
    background: #FFF;
    font-family: CircularStd-Black, sans-serif;
    text-transform: capitalize;
    color: #1F055E;
    font-size: 24px;
    border-radius: 0;
    border: 1px solid #FFF;
    padding: 10px 55px;
  }
  .apps-block.newsletter h1 {
    text-transform: none;
  }
  .apps-block.newsletter p {
    color: #FFF;
  }

  .apps-block.discover.discover--stations {
    background: #FFF;
  }

  .apps-block.discover h1 {
    text-align: center;
  }
  .apps-block.discover .cards {
    margin-top: 30px;
  }
  .apps-block.discover .cards a {
    width: 25%;
  }
  .apps-block.discover .cards a img {
    width: 100%;
    height: auto;
  }

/*>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<*/
/*>>>>>>>>>>>>>>>>>>> BRANCH <<<<<<<<<<<<<<<<<<<<<*/
/*>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<*/

  .layout.layout--one-column-full-width .layout__content {
    margin: 0;
    max-width: none;
  }

  .apps-block.branch {
    background: #3A00B3;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 45px 15% 60px;
  }
  .apps-block.branch h1 {
    font-size: 45px;
    color: #FFF;
    font-weight: 900;
    line-height: 60px;
    letter-spacing: 0.15px;
    margin-bottom: 15px;
  }
  .apps-block.branch p {
    color: #FFF;
    font-size: 28px;
    font-weight: 400;
    letter-spacing: 0.15px;
    line-height: 40px;
    margin-bottom: 25px;
  }
  .apps-block.branch p:last-of-type {
    line-height: 17px;
    font-size: 14px;
    margin-bottom: 0;
  }
  .apps-block.branch p small {
    font-family: CircularStd-Book;
    font-size: 14px;
    font-weight: 300;
    letter-spacing: 0.15px;
    line-height: 17px;
  }
  .apps-block.branch form#branch-app-text-cta {
    display: flex;
    flex-direction: row;
    border: 1px solid #FFF;
    margin-bottom: 25px;
  }
  form#branch-app-text-cta input#phone {
    height: 74px;
    background: transparent;
    border: none;
    text-align: center;
    width: 300px;
    font-family: CircularStd-Book;
    font-size: 22px;
    line-height: 26px;
    letter-spacing: 0.15px;
    font-weight: 300;
    color: #FFF;
  }
  form#branch-app-text-cta button[type=submit] {
    height: 74px;
    width: 300px;
    background: #FFF;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  form#branch-app-text-cta button span {
    font-family: CircularStd-Black;
    font-size: 24px;
    color: #1F055E;
    font-weight: 900;
    letter-spacing: -0.15px;
    line-height: 40px;
  }
  form#branch-app-text-cta button img {
    width: 20px;
    height: 18px;
    margin-left: 2px;
  }
  @media screen and (max-width: 480px) {
    .apps-block.branch {
      padding: 35px 5% 50px;
    }
    .apps-block.branch h1 {
      font-size: 26px;
      letter-spacing: 0.14px;
      margin-bottom: 14px;
    }
    .apps-block.branch p {
      font-size: 24px;
      line-height: 29px;
      margin-bottom: 34px;
    }
    .apps-block.branch form#branch-app-text-cta {
      flex-direction: column;
      margin-bottom: 9px;
    }
  }

  .radiocom-about {
    background: #FAFAFA;
  }
  .radiocom-about h1 {
    font-family: CircularStd-Black, sans-serif;
    color: #1F055E;
    text-transform: capitalize;
    font-size: 50px;
    line-height: 1.2em;
    margin: 0;
  }
  .radiocom-about p {
    font-family: ProximaNova-Regular, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }
  .radiocom-about button {
    background: #FFF;
    font-family: CircularStd-Black, sans-serif;
    text-transform: capitalize;
    color: #1F055E;
    font-size: 24px;
    border-radius: 0;
    border: 1px solid #FFF;
    padding: 10px 55px;
  }
  .radiocom-about button:focus {
    outline: none;
  }
  .radiocom-about button img {
    display: inline-block;
    vertical-align: top;
  }
  .radiocom-about a {
    display: inline-block;
    vertical-align: top;
  }
  .radiocom-about a button {
    cursor: pointer;
  }

  .about-block {
    display: block;
    background: #FAFAFA;
    width: 100%;
    height: auto;
    padding: 50px 100px;
  }
  .about-block:not(:last-of-type) {
    margin-bottom: 5px;
  }
  .about-block .description {
    width: 60%;
    padding: 0 100px 0 0;
  }
  .about-block .description p {
    margin: 40px auto;
  }

  .about-block.platform {
    display: flex;
  }
  .about-block.platform button {
    width: 197px;
    background: transparent;
    border: none;
    padding: 0;
  }
  .about-block.platform button:first-of-type {
    margin-right: 8px;
  }
  .about-block.platform a:first-of-type button {
    margin-right: 8px;
  }
  .about-block.platform .img-container {
    display: flex;
    width: 40%;
    align-items: center;
  }
  .about-block.platform .img-container img {
    width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: top;
  }

  .about-block.station-category {
    display: flex;
  }
  .about-block.station-category .description {
    width: 40%;
    padding: 0 50px 0 0;
  }
  .about-block.station-category .station-image-thumbs {
    display: flex;
    align-items: center;
    width: 60%;
  }
  .about-block.station-category .station-image-thumbs img {
    display: inline-block;
    vertical-align: top;
  }

  .about-block.cta {
    background: #1F055E;
    text-align: center;
  }
  .about-block.cta h1 {
    color: #FFF;
    text-align: center;
  }
  .about-block.cta p {
    color: #FFF;
    text-align: center;
    width: 60%;
    margin: 50px auto;
  }

  .about-block.listen-today {
    background: #3C00B7;
    color: #FFF;
    text-align: center;
  }
  .about-block.listen-today h1 {
    color: #FFF;
  }
  .about-block.listen-today a:first-of-type button {
    margin-right: 30px;
  }
  .about-block.listen-today .buttons {
    margin-top: 50px;
  }

  .about-block.listen-now {
    background: #3C00B7;
    color: #FFF;
    text-align: center;
    margin-top: 5px;
    background: #3c00b7;
    background: -moz-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: -webkit-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: linear-gradient(to bottom, #3c00b7 0%, #1f055e 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#3c00b7", endColorstr="#1f055e",GradientType=0 );
  }
  .about-block.listen-now h1 {
    color: #FFF;
  }
  .about-block.listen-now p {
    color: #FFF;
  }

  .about-block.newsletter h1 {
    text-transform: none;
  }
  .about-block.newsletter button {
    background: transparent;
    color: #FFF;
    border: 2px solid #FFF;
  }
  .about-block.newsletter p {
    width: 70%;
  }

  .alexa h1 {
    font-family: CircularStd-Black, Arial, sans-serif;
    color: #1F055E;
    font-size: 50px;
    line-height: 1.2em;
    margin: 0;
  }
  .alexa h3 {
    font-family: CircularStd-Black, Arial, sans-serif;
    font-size: 30px;
    line-height: 1.2em;
    margin: 0;
    text-transform: capitalize;
  }
  .alexa p {
    font-family: ProximaNova-Regular, Arial, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }

  .alexa-intro {
    margin-top: 5px;
    background: #3c00b7;
    background: -moz-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: -webkit-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: linear-gradient(to bottom, #3c00b7 0%, #1f055e 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#3c00b7", endColorstr="#1f055e",GradientType=0 );
    padding: 50px 20%;
    text-align: center;
  }
  .alexa-intro h1 {
    color: #FFF;
    margin: 40px 0;
  }
  .alexa-intro h3 {
    color: #FFF;
  }

  .alexa-guide {
    display: flex;
    padding: 50px 20%;
  }
  .alexa-guide .description {
    width: 72%;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .alexa-guide .description h1 {
    color: #3C00B7;
  }
  .alexa-guide .description ul {
    list-style-type: none;
    margin: 50px 0 0 0;
    padding: 0;
  }
  .alexa-guide .description li {
    list-style-image: none;
    margin: 0 0 20px 0;
  }
  .alexa-guide .description li .step {
    background: #3C00B7;
    height: 68px;
    line-height: 68px;
    width: 68px;
    display: inline-block;
    vertical-align: top;
    color: #FFF;
    font-size: 32px;
    font-family: CircularStd-Black, Arial, sans-serif;
    text-align: center;
    margin-right: 20px;
    float: left;
  }
  .alexa-guide .description li .instruction {
    vertical-align: top;
    line-height: 68px;
    font-family: ProximaNova-Regular, Arial, sans-serif;
    font-size: 30px;
  }
  .alexa-guide .description li .instructions-container {
    display: inline-block;
    vertical-align: top;
    height: 68px;
    width: calc(100% - 88px);
  }
  .alexa-guide .description li .instructions-container .instruction {
    line-height: 30px;
  }
  .alexa-guide .description li .instructions-container .example {
    display: block;
    font-size: 20px;
    font-family: ProximaNova-Regular, Arial, sans-serif;
    margin-top: 8px;
  }
  .alexa-guide .description li .two-lines {
    line-height: 50px;
  }
  .alexa-guide .img-right {
    display: flex;
    align-items: center;
    width: 28%;
  }
  .alexa-guide .img-right img {
    width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: top;
  }

  .alexa-enjoy {
    background: #3C00B7;
    padding: 50px;
    text-align: center;
  }
  .alexa-enjoy h1 {
    color: #FFF;
  }

  .sonos h1 {
    font-family: CircularStd-Black, Arial, sans-serif;
    color: #1F055E;
    font-size: 50px;
    line-height: 1.2em;
    margin: 0;
  }
  .sonos h3 {
    font-family: CircularStd-Black, Arial, sans-serif;
    font-size: 30px;
    line-height: 1.2em;
    margin: 0;
    text-transform: capitalize;
  }
  .sonos p {
    font-family: ProximaNova-Regular, Arial, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }

  .sonos-intro {
    margin-top: 5px;
    background: #3c00b7;
    background: -moz-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: -webkit-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: linear-gradient(to bottom, #3c00b7 0%, #1f055e 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#3c00b7", endColorstr="#1f055e",GradientType=0 );
    padding: 50px 30%;
    text-align: center;
  }
  .sonos-intro h1 {
    color: #FFF;
    margin: 40px 0;
  }
  .sonos-intro h3 {
    color: #FFF;
  }

  .sonos-guide {
    display: flex;
    padding: 50px 20%;
  }
  .sonos-guide .description {
    width: 72%;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .sonos-guide .description h1 {
    color: #3C00B7;
  }
  .sonos-guide .description ul {
    list-style-type: none;
    margin: 50px 0 0 0;
    padding: 0;
  }
  .sonos-guide .description li {
    list-style-image: none;
    margin: 0 0 20px 0;
  }
  .sonos-guide .description li .step {
    background: #3C00B7;
    height: 68px;
    line-height: 68px;
    width: 68px;
    display: inline-block;
    vertical-align: top;
    color: #FFF;
    font-size: 32px;
    font-family: CircularStd-Black, Arial, sans-serif;
    text-align: center;
    margin-right: 20px;
  }
  .sonos-guide .description li .instruction {
    display: inline-block;
    vertical-align: top;
    line-height: 68px;
    font-family: ProximaNova-Regular, Arial, sans-serif;
    font-size: 30px;
    width: calc(100% - 88px);
  }
  .sonos-guide .description li .instruction.two-lines {
    line-height: 34px;
  }
  .sonos-guide .img-right {
    display: flex;
    align-items: center;
    width: 28%;
  }
  .sonos-guide .img-right img {
    width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: top;
  }

  .sonos-enjoy {
    background: #3C00B7;
    padding: 50px;
    text-align: center;
  }
  .sonos-enjoy h1 {
    color: #FFF;
  }

  .roku h1 {
    font-family: CircularStd-Black, Arial, sans-serif;
    color: #1F055E;
    font-size: 50px;
    line-height: 1.2em;
    margin: 0;
  }
  .roku h3 {
    font-family: CircularStd-Black, Arial, sans-serif;
    font-size: 30px;
    line-height: 1.2em;
    margin: 0;
    text-transform: capitalize;
  }
  .roku p {
    font-family: ProximaNova-Regular, Arial, sans-serif;
    color: #5A5A5A;
    font-size: 24px;
  }

  .roku-intro {
    margin-top: 5px;
    background: #3c00b7;
    background: -moz-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: -webkit-linear-gradient(top, #3c00b7 0%, #1f055e 100%);
    background: linear-gradient(to bottom, #3c00b7 0%, #1f055e 100%);
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#3c00b7", endColorstr="#1f055e",GradientType=0 );
    padding: 50px 30%;
    text-align: center;
  }
  .roku-intro h1 {
    color: #FFF;
    margin: 40px 0;
  }
  .roku-intro h3 {
    color: #FFF;
  }

  .roku-guide {
    display: flex;
    padding: 50px 20%;
  }
  .roku-guide .description {
    width: 72%;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .roku-guide .description h1 {
    color: #3C00B7;
  }
  .roku-guide .description ul {
    list-style-type: none;
    margin: 50px 0 0 0;
    padding: 0;
  }
  .roku-guide .description li {
    list-style-image: none;
    margin: 0 0 20px 0;
  }
  .roku-guide .description li .step {
    background: #3C00B7;
    height: 68px;
    line-height: 68px;
    width: 68px;
    display: inline-block;
    vertical-align: top;
    color: #FFF;
    font-size: 32px;
    font-family: CircularStd-Black, Arial, sans-serif;
    text-align: center;
    margin-right: 20px;
  }
  .roku-guide .description li .instruction {
    display: inline-block;
    vertical-align: top;
    line-height: 68px;
    font-family: ProximaNova-Regular, Arial, sans-serif;
    font-size: 30px;
    width: calc(100% - 88px);
  }
  .roku-guide .description li .instruction.two-lines {
    line-height: 34px;
  }
  .roku-guide .img-right {
    display: flex;
    align-items: center;
    width: 28%;
  }
  .roku-guide .img-right img {
    width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: top;
  }

  .roku-enjoy {
    background: #3C00B7;
    padding: 50px;
    text-align: center;
  }
  .roku-enjoy h1 {
    color: #FFF;
  }

  @media all and (max-width: 1350px) {
    .apps-block.features {
      padding: 100px 16%;
    }
    .apps-block.features .description {
      width: 65%;
      padding: 0 100px 0 0;
    }
    .apps-block.features .description p {
      font-size: 20px;
    }
    .apps-block.features .description li {
      font-size: 20px;
    }
    .apps-block.features .img-container {
      width: 35%;
    }
  }
  @media all and (max-width: 1300px) {
    .apps-block.features {
      padding: 100px 15%;
    }
    .apps-block.features .description {
      width: 65%;
      padding: 0 50px 0 0;
    }
    .apps-block.features .description p {
      font-size: 20px;
    }
    .apps-block.features .description li {
      font-size: 20px;
    }
    .apps-block.features .img-container {
      width: 35%;
    }

    .about-block.cta p {
      width: 100%;
    }
  }
  @media all and (max-width: 1258px) {
    .apps-block.top-banner.cta a:first-of-type button {
      margin-right: 0;
    }
  }
  @media all and (max-width: 1200px) {
    .apps-block {
      padding: 50px 10%;
    }

    .apps-block.features {
      display: block;
    }
    .apps-block.features .description {
      width: 100%;
      padding: 0;
    }
    .apps-block.features .img-container {
      display: none;
    }
  }
  @media all and (max-width: 1169px) {
    .radiocom-apps h1 {
      font-size: 30px;
    }
    .radiocom-apps h3 {
      font-size: 20px;
    }
    .radiocom-apps p {
      font-size: 20px;
    }
    .radiocom-apps span {
      font-size: 20px;
    }
    .radiocom-apps li {
      font-size: 20px;
    }

    .apps-block.newsletter {
      padding: 50px 16%;
    }

    .apps-block.download {
      padding: 50px 16%;
    }

    .apps-block.features .img-container {
      display: none;
    }
  }
  @media all and (max-width: 900px) {
    .apps-block.top-banner {
      flex-direction: column-reverse;
    }
    .apps-block.top-banner .cta {
      width: 100%;
      padding: 0;
    }
    .apps-block.top-banner .img-container {
      width: 100%;
      max-width: 300px;
      margin: auto;
      margin-top: 50px;
    }

    .apps-block.top-banner.cta a:first-of-type button {
      margin-right: 30px;
    }

    .alexa-intro h1 {
      font-size: 30px;
    }
    .alexa-intro h3 {
      font-size: 20px;
    }

    .alexa-enjoy h1 {
      font-size: 30px;
    }

    .alexa-guide {
      display: block;
    }
    .alexa-guide .description {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .alexa-guide .img-right {
      width: 150px;
      margin: auto;
      margin-top: 50px;
    }

    .sonos-intro h1 {
      font-size: 30px;
    }
    .sonos-intro h3 {
      font-size: 20px;
    }

    .sonos-enjoy h1 {
      font-size: 30px;
    }

    .sonos-guide {
      display: block;
    }
    .sonos-guide .description {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .sonos-guide .img-right {
      width: 150px;
      margin: auto;
      margin-top: 50px;
    }

    .roku-intro h1 {
      font-size: 30px;
    }
    .roku-intro h3 {
      font-size: 20px;
    }

    .roku-enjoy h1 {
      font-size: 30px;
    }

    .roku-guide {
      display: block;
    }
    .roku-guide .description {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .roku-guide .img-right {
      width: 150px;
      margin: auto;
      margin-top: 50px;
    }
  }
  @media all and (max-width: 738px) {
    .apps-block.download a:first-of-type button {
      margin-right: 0;
    }
  }
  @media all and (max-width: 800px) {
    .about-block {
      padding: 50px;
    }
    .about-block .description {
      width: 100%;
      padding: 0;
    }

    .about-block.platform {
      display: block;
    }
    .about-block.platform .img-container {
      width: 100%;
      margin-top: 20px;
    }

    .about-block.station-category {
      display: block;
    }
    .about-block.station-category .description {
      width: 100%;
      padding: 0;
    }
    .about-block.station-category .station-image-thumbs {
      width: 100%;
      margin: 0;
    }

    .radiocom-about h1 {
      font-size: 30px;
    }
    .radiocom-about p {
      font-size: 20px;
    }

    .about-block.listen-today a:first-of-type button {
      margin: 0;
    }
  }
  @media all and (max-width: 1543px) {
    .alexa-guide {
      padding: 50px 15%;
    }

    .sonos-guide {
      padding: 50px 15%;
    }

    .roku-guide {
      padding: 50px 15%;
    }
  }
  @media all and (max-width: 1216px) {
    .alexa-intro {
      padding: 50px 20%;
    }

    .alexa-guide {
      padding: 50px 5%;
    }

    .sonos-intro {
      padding: 50px 20%;
    }

    .sonos-guide {
      padding: 50px 5%;
    }

    .roku-intro {
      padding: 50px 20%;
    }

    .roku-guide {
      padding: 50px 5%;
    }
  }
  @media all and (max-width: 1100px) {
    .alexa-guide {
      padding: 50px 5%;
    }

    .sonos-guide {
      padding: 50px 5%;
    }

    .roku-guide {
      padding: 50px 5%;
    }
  }

  /* Additional styling necessary due to differences between Frequency and Clay base CSS */
  .radiocom-about img {
    max-width: 100%;
    height: auto;
  }

  .radiocom-apps p,
  .radiocom-apps ul,
  .radiocom-about p {
    line-height: 1.6;
  }

  .radiocom-apps ul {
    padding-inline-start: 40px;
  }

  .radiocom-apps li {
    list-style-type: disc;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
<div class="radiocom-apps">
  <div class="apps-block cta top-banner">
    <div class="img-container">
      <img src="https://images.radio.com/aiu-media/iphonex.png">
    </div>
    <div class="cta">
      <h1>listen to over 300 of your favorite radio stations</h1>
      <span>Download the Radio.com App Now!</span>
      <h3>live. anytime. anywhere.</h3>
      <div class="buttons">
        <a target="_blank" href="https://app.radio.com/Rqw82Z9QwN" title="Download on the App Store">
          <button>
            <img src="https://images.radio.com/aiu-media/logo-itunes.png">
          </button>
        </a><!--
        --><a target="_blank" href="https://app.radio.com/nbsSoH2QwN" title="Get it on Google Play">
          <button>
            <img src="https://images.radio.com/aiu-media/logo-googleplay.png">
          </button>
        </a>
      </div>
    </div>
  </div>
  <div class="apps-block branch">
    <h1>Text Me The App</h1>
    <p>You will receive a one-time SMS to download the RADIO.COM App.</p>
    <form id="branch-app-text-cta" onsubmit="sendSMS(event, this); return false;">
      <input type="tel" id="phone" name="phone" pattern="\\(*[0-9]{3}\\)*[\\s\\D]*[0-9]{3}[\\s\\D]*[0-9]{4}" placeholder="(123) 123-1234" required>
      <button type="submit"><span>SEND LINK</span><img src="https://images.radio.com/aiu-media/submittextarrow-baa4df8d-45ae-4b40-b61e-a738108ec6ff.png" alt="->"/></button>
    </form>
    <p><small>Message and data rates may apply.</small></p>
  </div>
  <div class="apps-block features">
    <div class="description">
      <h1>Radio.com App Features</h1>
      <p>The Radio.com app lets you listen to your favorite radio stations for free - anytime, anywhere. Listen to over 300 stations along with over 1,100 podcasts. Explore by location, or genre to find music, news and sports from your home area, or across the U.S.</p>
      <ul>
        <li>Discover and enjoy your favorite music, news and talk radio from LIVE stations across the country.</li>
        <li>Listen anywhere on all mobile and home devices.</li>
        <li>Listen to your favorite local sports stations to get news and commentary on your favorite teams.</li>
        <li>Connect with your favorite radio shows through contests, social media and podcasts.</li>
        <li>Subscribe to and download your favorite podcasts across sports, news, politics, lifestyle and technology.</li>
        <li>Create custom alarms with your favorite radio stations.</li>
      </ul>
      <div class="buttons">
        <a target="_blank" href="https://app.radio.com/uvJUE0GDoN" title="Download on the App Store">
          <button>
            <img src="https://images.radio.com/aiu-media/logo-itunes.png">
          </button>
        </a>
        <a target="_blank" href="https://app.radio.com/s0GHLgPKoN" title="Get it on Google Play">
          <button>
            <img src="https://images.radio.com/aiu-media/logo-googleplay.png">
          </button>
        </a>
      </div>
    </div>
    <div class="img-container">
      <img src="https://images.radio.com/aiu-media/iphone-krock.png">
    </div>
  </div>
  <div class="apps-block cta newsletter">
    <h1>Sign up for the Radio.com Newsletter</h1>
    <p>Be the first to know when new features, content, and shows are available on your favorite streaming app and online music destination!</p>
    <a href="/sign-radiocom-newsletter" title="Sign Up Now"><button>sign up now</button></a>
  </div>
  <div class="apps-block discover discover--stations">
    <h1>Discover Stations</h1>
    <div class="cards cards--stations">
      <div class="row">
        <a target="_blank" href="https://app.radio.com/Yy742S5KoN"><img src="http://assets.radio.com/images/marketing/about/Station-WFAN.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/isaRC8cLoN"><img src="http://assets.radio.com/images/marketing/about/Station-WIP.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/0zGnXCDLoN"><img src="http://assets.radio.com/images/marketing/about/Station-KROQ.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/Q1ynAALLoN"><img src="http://assets.radio.com/images/marketing/about/Station-WEEI.png"></a>
      </div>
      <div class="row">
        <a target="_blank" href="https://app.radio.com/mA3ZmoZLoN"><img src="http://assets.radio.com/images/marketing/about/Station-KISW.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/oWe4rB6LoN"><img src="http://assets.radio.com/images/marketing/about/Station-WINS.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/LxOlTkbMoN"><img src="http://assets.radio.com/images/marketing/about/Station-WVEE.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/3A028xgMoN"><img src="http://assets.radio.com/images/marketing/about/Station-CBSFM.png"></a>
      </div>
    </div>
  </div>
  <div class="apps-block discover discover--podcasts">
    <h1>Discover Podcasts</h1>
    <div class="cards cards--podcasts">
      <div class="row">
        <a target="_blank" href="https://app.radio.com/2EXOjB9MoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-Skimm.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/NBI0Zc3NoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-Podsave.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/q96a0C9NoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-Goop.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/RKXNgUjOoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-Skip.png"></a>
      </div>
      <div class="row">
        <a target="_blank" href="https://app.radio.com/QDGRX6oOoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-Tony.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/l2lMRjtOoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-WFC.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/Fv98uIyOoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-Hive.png"></a><!--
        --><a target="_blank" href="https://app.radio.com/DLyhtJDOoN"><img src="http://assets.radio.com/images/marketing/about/Podcast-FromHeart.png"></a>
      </div>
    </div>
  </div>
  <div class="apps-block cta download">
    <h1>download now</h1>
    <p>Want to listen to your favorite Radio.com stations on the go? Download the app below and start enjoying live radio on your smartphone.</p>
    <div class="buttons">
      <a target="_blank" href="https://app.radio.com/Rqw82Z9QwN" title="Download on the App Store">
        <button>
          <img src="https://images.radio.com/aiu-media/logo-itunes.png">
        </button>
      </a><!--
      --><a target="_blank" href="https://app.radio.com/nbsSoH2QwN" title="Get it on Google Play">
        <button>
          <img src="https://images.radio.com/aiu-media/logo-googleplay.png">
        </button>
      </a>
    </div>
    <span>*Works on iOS 10.0.5+, Android Kitkat and above.</span>
  </div>
</div>
<script type="text/javascript">
  (function(b,r,a,n,c,h,_,s,d,k){if(!b[n]||!b[n]._q){for(;s<_.length;)c(h,_[s++]);d=r.createElement(a);d.async=1;d.src="https://cdn.branch.io/branch-latest.min.js";k=r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d,k);b[n]=h}})(window,document,"script","branch",function(b,r){b[r]=function(){b._q.push([r,arguments])}},{_q:[],_v:1},"addListener applyCode banner closeBanner creditHistory credits data deepview deepviewCta first getCode init link logout redeem referrals removeListener sendSMS setBranchViewData setIdentity track validateCode".split(" "), 0);

  branch.init('${branchKey}');
  function sendSMS(event, form) {
    event.preventDefault();
    var phone = decodeURI(form.phone.value).replace(/[^0-9.]/g,'');
    var linkData = {
        tags: [],
        channel: 'Website',
        feature: 'TextMeTheApp',
        data: {}
    };
    var options = {};
    var callback = function(err, result) {
        if (err) {
            alert("Sorry, something went wrong: ", err, phone);
        }
        else {
            alert("SMS sent!");
        }
    };
    branch.sendSMS(phone, linkData, options, callback);
    form.phone.value = "";
  }
</script>
`;

// Create correct clay data structure
const payload = {
  '_components' : {
    [componentType]: {
      instances: {
        [instanceType]: data
      }
    }
  }
};

fs.writeFile(`${__dirname}/${componentType}-${instanceType}.yml`, YAML.stringify(payload, 6, 2), 'utf8', function(err) {
    if (err) throw err;
  }
);
