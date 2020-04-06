module.exports = function getTwoColumnData (hostUrl) {
  return JSON.parse(`{
    "_components": {
      "two-column-component": {
        "instances": {
          "station-front": {
            "col1": [
              { "_ref": "${hostUrl}/_components/more-content-feed/instances/station-basic-music" }
            ],
            "col2": [
              { "_ref": "${hostUrl}/_components/google-ad-manager/instances/contentCollectionLogoSponsorship" },
              { "_ref": "${hostUrl}/_components/google-ad-manager/instances/halfPageBottomTopic" }
            ]
          }
        }
      }
    }
  }`);
};
