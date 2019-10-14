'use strict';

var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  proxyquire = require('proxyquire'),
  requireValidateSlug = ({
    urlExists = async () => true
  }) => {
    return proxyquire('./url-slug', {
      '../../universal/url-exists': urlExists
    });
  },
  defaultComponentData = {
    seoHeadline: 'Duplicate slug test 2',
    sectionFront: 'sports',
    secondarySectionFront: 'nfl'
  },
  generateMockState = ({
    componentData = defaultComponentData,
    pageType = 'article',
    currentPageUrl = 'http://clay.radio.com/section-front/secondary/slug',
    components = {
      [`clay.radio.com/_components/${pageType}/instances/cjzsvb07d000f1mpf2el59sn4`]: componentData
    }
  }) => ({
    components,
    page: {
      uri: 'clay.radio.com/_pages/cjzsvb01u00001mpfddnsbu0e',
      state: {
        url: currentPageUrl
      }
    },
    locals: {
      site: {
        prefix: 'clay.radio.com'
      }
    }
  });

describe(`${dirname}/${filename}`, () => {
  it('is valid when there is no component to validate', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: async () => false
      }),
      mockState = generateMockState({
        pageType: 'homePage',
        currentPageUrl: 'http://clay.radio.com',
        components: {}
      }),
      errors = await urlSlugValidator(mockState);

    expect(errors.length).to.equal(0);
  });

  it('[article] passes when unique slug', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: async () => false
      }),
      errors = await urlSlugValidator(generateMockState({
        pageType: 'article',
        currentPageUrl: 'http://clay.radio.com/sports/nfl/sports-page-test-foobar',
        componentData: {
          ...defaultComponentData,
          slug: 'sports-page-test-foobar-asdf'
        }
      }));

    expect(errors.length).to.equal(0);
  });

  it('[article] shows error when slug is duplicate with any page url other than current page url', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: () => true
      }),
      errors = await urlSlugValidator(generateMockState({
        pageType: 'article',
        currentPageUrl: 'http://clay.radio.com/sports/nfl/sports-page-test-foobar',
        componentData: {
          ...defaultComponentData,
          slug: 'not-current-page-slug'
        }
      }));

    expect(errors.length).to.equal(1);
  });

  it('[article] passes when slug is same as current page url', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: () => true
      }),
      errors = await urlSlugValidator(generateMockState({
        pageType: 'article',
        currentPageUrl: 'http://clay.radio.com/sports/nfl/sports-page-test-foobar',
        componentData: {
          ...defaultComponentData,
          slug: 'sports-page-test-foobar'
        }
      }));

    expect(errors.length).to.equal(0);
  });

  it('[gallery] passes when unique slug', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: async () => false
      }),
      errors = await urlSlugValidator(generateMockState({
        pageType: 'gallery',
        currentPageUrl: 'http://clay.radio.com/sports/nfl/gallery/sports-page-test-foobar',
        componentData: {
          ...defaultComponentData,
          slug: 'sports-page-test-foobar'
        }
      }));

    expect(errors.length).to.equal(0);
  });

  it('[gallery] shows error when slug is duplicate with any page url other than current page url', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: () => true
      }),
      errors = await urlSlugValidator(generateMockState({
        pageType: 'gallery',
        currentPageUrl: 'http://clay.radio.com/sports/nfl/gallery/sports-page-test-foobar',
        componentData: {
          ...defaultComponentData,
          slug: 'not-current-page-slug'
        }
      }));

    expect(errors.length).to.equal(1);
  });

  it('[gallery] passes when slug is same as current page url', async () => {
    const { validate: urlSlugValidator } = requireValidateSlug({
        urlExists: () => true
      }),
      errors = await urlSlugValidator(generateMockState({
        pageType: 'article',
        currentPageUrl: 'http://clay.radio.com/sports/nfl/gallery/sports-page-test-foobar',
        componentData: {
          ...defaultComponentData,
          slug: 'sports-page-test-foobar'
        }
      }));

    expect(errors.length).to.equal(0);
  });
});
