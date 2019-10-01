'use strict';

module.exports = {
  role: 'container',
  style: {
    backgroundColor: 'purple'
  },
  layout: {
    ignoreDocumentMargin: true,
    padding: {
      top: 15,
      bottom: 30
    }
  },
  components: [
    {
      role: 'image',
      URL: 'https://via.placeholder.com/140x17',
      layout: {
        maximumContentWidth: 140,
        maximumWidth: 140,
        margin: {
          bottom: 11
        }
      }
    },
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
    {
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
              URL: 'https://via.placeholder.com/26x17',
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
    }
  ]
};
