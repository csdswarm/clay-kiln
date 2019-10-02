'use strict';

const URL_LOGO = 'https://images.radio.com/aiu-media/radiocomlogowhite-47112475-0fac-4811-b34b-49f88dc2af49.png',
  URL_MAIL_ICON = 'https://images.radio.com/aiu-media/mail-7d850a71-cd77-46e5-ae88-76633a92bb57.png',
  COLOR_PRIMARY = '#1F055E',
  logoComponent = {
    role: 'image',
    URL: URL_LOGO,
    layout: {
      maximumContentWidth: 140,
      maximumWidth: 140,
      margin: {
        bottom: 11
      }
    }
  },
  ctaLink = {
    role: 'container',
    contentDisplay: {
      type: 'collection',
      alignment: 'center',
      distribution: 'narrow',
      maximumWidth: 190
    },
    components: [
      {
        role: 'container',
        contentDisplay: {
          type: 'horizontal_stack'
        },
        style: {
          backgroundColor: 'white'
        },
        layout: {
          padding: {
            top: 16,
            bottom: 16,
            right: 30,
            left: 30
          }
        },
        components: [
          {
            role: 'image',
            URL: URL_MAIL_ICON,
            layout: {
              maximumContentWidth: 26,
              maximumWidth: 26
            }
          },
          {
            role: 'body',
            text: '<a href="https://app.radio.com/apple-news-download"><span data-anf-textstyle="footerCTAStyle">SIGN UP NOW</span></a>',
            format: 'html',
            layout: {
              padding: {
                left: 10
              }
            }
          }
        ]
      }
    ]
  };

module.exports = {
  role: 'container',
  style: {
    backgroundColor: COLOR_PRIMARY
  },
  layout: {
    ignoreDocumentMargin: true,
    padding: {
      top: 15,
      bottom: 30
    }
  },
  components: [
    logoComponent,
    {
      role: 'body',
      text: 'Get the latest news and alerts delivered right to your inbox',
      textStyle: {
        fontSize: 18,
        fontName: 'Avenir-Book',
        textColor: 'white',
        textAlignment: 'center'
      },
      layout: {
        margin: {
          bottom: 15
        }
      }
    },
    ctaLink
  ]
};
