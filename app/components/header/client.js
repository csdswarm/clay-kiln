/*>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
/* |||||||||||||||| Variables |||||||||||||||| */
/*>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
const navSections = document.getElementsByClassName("radiocom-nav__category-button")
const mobileNavSections = document.getElementsByClassName("nav-drawer__sub-nav")
const mutableImages = ["account-btn", "search-btn"]
let isMobile = false
let activeHamburger = false


/*>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
/* |||||||||||||||| Functions |||||||||||||||| */
/*>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
const toggleHamburger = function(toggleHamburgerOnly) {
  isMobile =
    document.getElementsByClassName("radiocom-nav-placeholder")[0].offsetWidth >
    1023
      ? false
      : true;
  activeHamburger = !activeHamburger
  let bars = document.getElementsByClassName("bar")
  let navDrawer = document.getElementsByClassName("nav-drawer--mobile")[0]
  if (activeHamburger && isMobile) {
    for (let bar of bars) {
      bar.classList.add("active")
    }
    navDrawer.classList.add("nav-drawer--active")
  } else {
    for (let bar of bars) {
      bar.classList.remove("active")
    }
    navDrawer.classList.remove("nav-drawer--active")
  }
  if (!toggleHamburgerOnly) toggleDrawer(navDrawer, activeHamburger, true)
}
const toggleDrawer = function(event, show) {
  let navDrawer
  isMobile =
    document.getElementsByClassName("radiocom-nav-placeholder")[0].offsetWidth >
    1023
      ? false
      : true;
  let classes = ["nav-drawer--sub-nav-active", "nav-drawer--active"]
  let navDrawers = document.getElementsByClassName("nav-drawer")
  for (let drawer of navDrawers) {
    drawer.classList.remove(...classes)
  }
  if (!isMobile) {
    navDrawer = event.currentTarget.querySelector(".nav-drawer")
    if (show && ["listen", "download"].indexOf(navDrawer.classList[1]) == -1) {
      navDrawer.classList.add(...classes)
    }
  } else {
    navDrawer = document.getElementsByClassName("nav-drawer--mobile")[0]
    if (show) {
      navDrawer.classList.add(...classes)
    } else {
      navDrawer.classList.remove(...classes)
    }
  }
}
const setCategory = function(event) {
  // Add active class to section
  const activeMobileClass = "nav-drawer__sub-nav--active";
  if (event.currentTarget.classList.contains(activeMobileClass)) {
    event.currentTarget.classList.remove(activeMobileClass)
  } else {
    for (let navSection of mobileNavSections) {
      navSection.classList.remove(activeMobileClass)
    }
    event.currentTarget.classList.add(activeMobileClass)
  }
}
const toggleImage = function(event) {
  const defaultImage = event.currentTarget.querySelector(".default")
  const hoveredImage = event.currentTarget.querySelector(".hover")
  if (event.type == 'mouseover') {
    defaultImage.classList.add('inactive')
    defaultImage.classList.remove('active')
    hoveredImage.classList.add('active')
    hoveredImage.classList.remove('inactive')
  } else {
    defaultImage.classList.add('active')
    defaultImage.classList.remove('inactive')
    hoveredImage.classList.add('inactive')
    hoveredImage.classList.remove('active')
  }
}


/*>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
/* |||||||||||||| Event Listeners |||||||||||| */
/*>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
document.getElementById("hamburger").addEventListener("click", toggleHamburger)
for (let image of mutableImages) {
  document.getElementById(image).addEventListener("mouseover", function(e) { toggleImage(e) })
  document.getElementById(image).addEventListener("mouseout", function(e) { toggleImage(e) })
}

for (let navSection of mobileNavSections) {
  // Toggle Mobile Section Navs
  navSection.addEventListener("click", function(e) { setCategory(e) })
}
for (let navSection of navSections) {
  const activeClass = "radiocom-nav__category-button--active"
  // Highlight Section Button in Nav if on Section Page
  // document.getElementsByClassName("radiocom-nav__category-button--entertainment")[0].classList.add(activeClass);

  // Add Listeners to Section Buttons on Hover to Toggle Drawers
  if (
    !navSection.classList.contains("radiocom-nav__category-button--download") &&
    !navSection.classList.contains("radiocom-nav__category-button--listen")
  ) {
    navSection.addEventListener("mouseover", function(e) { toggleDrawer(e, true) })
    navSection.addEventListener("mouseout", function(e) { toggleDrawer(e, false) })
  }
}
// Add Listener on Window Resize to Remove Mobile Nav When Not on Mobile
window.addEventListener("resize", function() {
  let navDrawer = document.getElementsByClassName("nav-drawer--mobile")[0]
  isMobile =
    document.getElementsByClassName("radiocom-nav-placeholder")[0].offsetWidth >
    1023
      ? false
      : true;
  let classes = ["nav-drawer--active", "nav-drawer--sub-nav-active"]
  if (!isMobile) {
    navDrawer.classList.remove(...classes)
    toggleHamburger(true)
  }
})
