
const Handlebars = require('handlebars')
require('clayhandlebars')(Handlebars)

const [ moreContentFeed ] = document.getElementsByClassName('component--more-content-feed')
const [ loadMore ] = document.getElementsByClassName('section__content-feed-container__loadmore')
const [ linksSection ] = document.getElementsByClassName('more-content-feed__links')

// the current page that is queried for the feed.
let currentPage = 1;
const moreContentUrl = moreContentFeed.getAttribute('data-uri').replace(/^.*\.com/, '')

// load another page every time the load more button is clicked!
loadMore.onclick = function() {
	fetch(`${moreContentUrl}?page=${currentPage++}`)
	.then((response) => response.json())
	.then((data) => {

		const template = Handlebars.compile(itemTemplate)
		//data.content = data.content.slice(0, data.pageLength); // get the first N items from the content result (which returns 10)

		for (let feedItem of data.rawQueryResults) {
			const wrapper = document.createElement('div')
			data.feedItem = feedItem;
			linksSection.appendChild(wrapper)
			wrapper.outerHTML = template(data)
		}
		if (!data.moreResults) {
			loadMore.parentNode.removeChild(loadMore)
		}
	})
}

const itemTemplate = `
	<li>
		<a class="links__link links__link--{{ feedItem.articleType }}" href="{{ feedItem.canonicalUrl }}"
			 data-track-type="feedItem-link"
			 data-track-component-name="more-content-feed"
			 data-track-page-uri="{{ feedItem.pageUri }}"
			 data-track-headline="{{ feedItem.primaryHeadline }}"
			 data-track-component-title="More Content Feed"
			 data-track-sectionFront="{{ feedItem.articleType }}">
			<div class="link__thumb" style="background-image:url({{ feedItem.feedImgUrl }});">
				{{#if (compare populateFrom 'all')}}
					<span class="thumb__section-front">{{{ feedItem.articleType }}}</span>
				{{/if}}
				{{#unless (compare locationOfContentFeed 'homepage') }}
					<span class="thumb__content-type">
						{{#ifAny (compare feedItem.lead 'youtube') (compare feedItem.lead 'brightcove')}}
							{{{ read 'components/more-content-feed/media/watch.svg' }}}
						{{/ifAny}}
						{{#if (compare feedItem.lead 'audio')}}
							{{{ read 'components/more-content-feed/media/listen.svg' }}}
						{{/if}}
					</span>
				{{/unless}}
				<span class="thumb__datetime-posted">
					{{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
				</span>
			</div>
			<div class="link__info">
				<span class="info__headline">{{{ feedItem.primaryHeadline }}}</span>
				<span class="info__teaser">{{{ feedItem.teaser }}}</span>
				<span class="info__datetime-posted">
					{{ formatLocalDate feedItem.date 'MMMM D, YYYY' }}
				</span>
			</div>
		</a>
	</li>
`
