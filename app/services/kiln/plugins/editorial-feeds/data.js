'use strict';

const editorials = [
    {
      id: Math.floor(Math.random() * 100),
      callsign: 'WRST_V1',
      feeds: {
        ac: false,
        rock: false,
        urban: false,
        hot_ac: true,
        sports: false,
        country: true,
        hip_hop: false,
        r_and_b: false,
        trending: true,
        news_talk: false,
        adult_hits: false,
        chr_top_40: false,
        throwbacks: false,
        alternative: false,
        classic_hits: false,
        classic_rock: false,
        hot_ac_top_40_chr: true
      }
    },
    {
      id: Math.floor(Math.random() * 100),
      callsign: 'WRST_AB',
      feeds: {
        ac: false,
        rock: false,
        urban: false,
        hot_ac: true,
        sports: false,
        country: true,
        hip_hop: false,
        r_and_b: false,
        trending: true,
        news_talk: false,
        adult_hits: false,
        chr_top_40: false,
        throwbacks: false,
        alternative: false,
        classic_hits: false,
        classic_rock: false,
        hot_ac_top_40_chr: true
      }
    }
  ],
  newStationFeed = {
    feeds: {
      ac: false,
      rock: false,
      urban: false,
      hot_ac: false,
      sports: false,
      country: false,
      hip_hop: false,
      r_and_b: false,
      trending: false,
      news_talk: false,
      adult_hits: false,
      chr_top_40: false,
      throwbacks: false,
      alternative: false,
      classic_hits: false,
      classic_rock: false,
      hot_ac_top_40_chr: false
    },
    market: '',
    rdc_domain: '',
    call_letters: ''
  };

module.exports = { editorials, newStationFeed };
