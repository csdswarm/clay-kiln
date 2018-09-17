'use strict';

function Constructor() {
	const sidebar = document.getElementsByClassName("content__sidebar")[0]
	const articleBody = document.getElementsByClassName("article__body")[0]
	this.repositionRightRail(sidebar, articleBody)
}

Constructor.prototype = {
  /**
   * Repositions the right rail under the article headline &
   * subheadline so that it is in line with the article body.
   * @function
   */
  repositionRightRail: function(sidebar, articleBody) {
  	sidebar.style.marginTop = articleBody.offsetTop + "px"
  	sidebar.style.position = "relative"
  	sidebar.style.visibility = "visible"
  }
};

console.log("article client.js")

module.exports = () => new Constructor();
