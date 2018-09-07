/**
 * Repositions the right rail under the article headline &
 * subheadline so that it is in line with the article body.
 * @function
 */
function repositionRightRail() {
	const sidebar = document.getElementsByClassName("content__sidebar")[0]
	const articleBody = document.getElementsByClassName("article__body")[0]
	sidebar.style.marginTop = articleBody.offsetTop + "px"
	sidebar.style.position = "relative"
	sidebar.style.visibility = "visible"
}

document.addEventListener('vueLayoutUpdated', function(){
	repositionRightRail()
}, false)
