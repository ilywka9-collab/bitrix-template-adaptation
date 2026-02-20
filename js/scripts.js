let WW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
let WH = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
const BODY = document.body

const scriptLoadCache = {}

const loadExternalScript = src => {
	if (scriptLoadCache[src]) return scriptLoadCache[src]

	scriptLoadCache[src] = new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = src
		script.defer = true
		script.onload = resolve
		script.onerror = reject
		document.head.appendChild(script)
	})

	return scriptLoadCache[src]
}

const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector))

const fadeIn = (el, duration = 300) => {
	if (!el) return
	el.style.display = 'block'
	el.style.opacity = '0'
	el.style.transition = `opacity ${duration}ms linear`
	requestAnimationFrame(() => {
		el.style.opacity = '1'
	})
}

const fadeOut = (el, duration = 200) => {
	if (!el) return
	el.style.opacity = '0'
	el.style.transition = `opacity ${duration}ms linear`
	setTimeout(() => {
		el.style.display = 'none'
	}, duration)
}

const wrapElement = (el, className) => {
	if (!el || el.parentElement?.classList.contains(className)) return el?.parentElement
	const wrapper = document.createElement('div')
	wrapper.className = className
	el.parentNode.insertBefore(wrapper, el)
	wrapper.appendChild(el)
	return wrapper
}

const isElementVisible = el => {
	if (!el) return false
	return getComputedStyle(el).visibility !== 'hidden'
}

let headerInit
let headerHeight
let mobHeaderInit
let mobHeaderHeight

const updateFixedHeadersOnScroll = () => {
	const scrolled = window.scrollY > 0

	if (typeof headerInit !== 'undefined' && headerInit) {
		const header = document.querySelector('header')
		header?.classList.toggle('fixed', scrolled)
	}

	if (typeof mobHeaderInit !== 'undefined' && mobHeaderInit) {
		const mobHeader = document.querySelector('.mob_header')
		mobHeader?.classList.toggle('fixed', scrolled)
	}
}

document.addEventListener('DOMContentLoaded', () => {
	// History slider (lazy load Swiper only when section is near viewport)
	const history = qsa('.history .swiper')

	if (history.length) {
		let historyInited = false

		const initHistory = () => {
			if (historyInited) return
			historyInited = true

			loadExternalScript('js/swiper-bundle.min.js')
				.then(() => {
					history.forEach((el, i) => {
						el.classList.add('history_s' + i)

						new Swiper('.history_s' + i, {
							loop: true,
							loopAdditionalSlides: 2,
							speed: 500,
							watchSlidesProgress: true,
							slideActiveClass: 'active',
							slideVisibleClass: 'visible',
							lazy: true,
							navigation: {
								nextEl: '.swiper-button-next',
								prevEl: '.swiper-button-prev'
							},
							slidesPerView: 'auto',
							spaceBetween: 24
						})
					})
				})
				.catch(() => {
					historyInited = false
				})
		}

		const historySection = document.querySelector('.history') || history[0]

		if ('IntersectionObserver' in window && historySection) {
			const observer = new IntersectionObserver((entries, obs) => {
				if (entries.some(entry => entry.isIntersecting)) {
					obs.disconnect()
					initHistory()
				}
			}, { rootMargin: '300px 0px' })

			observer.observe(historySection)
		} else if ('requestIdleCallback' in window) {
			requestIdleCallback(initHistory, { timeout: 1200 })
		} else {
			setTimeout(initHistory, 600)
		}
	}

	// Mob. menu
	const overlay = document.querySelector('.overlay')
	const mobMenuBtn = document.querySelector('.mob_header .mob_menu_btn')
	const mobMenu = document.querySelector('.mob_menu')

	mobMenuBtn?.addEventListener('click', e => {
		e.preventDefault()
		mobMenuBtn.classList.toggle('active')
		BODY.classList.toggle('lock')
		mobMenu?.classList.toggle('show')
		mobMenuBtn.classList.contains('active') ? fadeIn(overlay, 300) : fadeOut(overlay, 200)
	})

	const closeMenu = e => {
		e?.preventDefault()
		mobMenuBtn?.classList.remove('active')
		BODY.classList.remove('lock')
		mobMenu?.classList.remove('show')
		fadeOut(overlay, 200)
	}

	qsa('.mob_menu .head .close_btn').forEach(btn => btn.addEventListener('click', closeMenu))
	overlay?.addEventListener('click', closeMenu)

	qsa('.mob_menu .menu .item > a.sub_link').forEach(link => {
		link.addEventListener('click', e => {
			e.preventDefault()
			link.nextElementSibling?.classList.add('show')
		})
	})

	qsa('.mob_menu .menu .sub .back_btn').forEach(btn => {
		btn.addEventListener('click', e => {
			e.preventDefault()
			btn.closest('.sub')?.classList.remove('show')
		})
	})

	const mobSearch = document.querySelector('.mob_menu .mob_search')
	document.querySelector('.mob_menu .search_btn')?.addEventListener('click', e => {
		e.preventDefault()
		mobSearch?.classList.add('show')
	})
	document.querySelector('.mob_menu .mob_search .back_btn')?.addEventListener('click', e => {
		e.preventDefault()
		mobSearch?.classList.remove('show')
	})

	// Phone input mask (lazy load IMask on first focus)
	const phoneInputs = qsa('input[type=tel]')

	if (phoneInputs.length) {
		const applyPhoneMask = input => {
			if (input.dataset.maskApplied === '1') return
			IMask(input, {
				mask: '+{7} (000) 000-00-00',
				lazy: true
			})
			input.dataset.maskApplied = '1'
		}

		document.addEventListener('focusin', e => {
			const target = e.target
			if (target && target.matches && target.matches('input[type=tel]')) {
				loadExternalScript('js/imask.js')
					.then(() => applyPhoneMask(target))
					.catch(() => {})
			}
		})
	}

	if (is_touch_device()) {
		const subMenus = qsa('header .menu .sub')
		qsa('header .menu .item > a.sub_link').forEach(link => {
			link.addEventListener('click', e => {
				const dropdown = link.nextElementSibling
				if (dropdown && !isElementVisible(dropdown)) {
					e.preventDefault()
					subMenus.forEach(el => el.classList.remove('show'))
					dropdown.classList.add('show')
					BODY.style.cursor = 'pointer'
				}
			})
		})

		document.addEventListener('click', e => {
			if (!e.target.closest('.menu')) {
				subMenus.forEach(el => el.classList.remove('show'))
				BODY.style.cursor = 'default'
			}
		})
	}

	// Solutions
	setHeight(qsa('.solutions .item .name'))
	setHeight(qsa('.solutions .item .solution .desc'))
	setHeight(qsa('.solutions .item .result .desc'))

	// Mob. footer
	qsa('footer .data .title').forEach(title => {
		title.addEventListener('click', e => {
			e.preventDefault()
			title.classList.toggle('active')
			const next = title.nextElementSibling
			if (!next) return
			next.style.display = next.style.display === 'none' || getComputedStyle(next).display === 'none' ? 'block' : 'none'
		})
	})

	// Search
	const headerSearchBtn = document.querySelector('header .search_btn')
	const searchModal = document.querySelector('.search')
	const searchCloseBtn = document.querySelector('.search .close_btn')

	headerSearchBtn?.addEventListener('click', e => {
		e.preventDefault()
		headerSearchBtn.classList.add('active')
		BODY.classList.add('lock')
		fadeIn(searchModal, 300)
	})

	searchCloseBtn?.addEventListener('click', e => {
		e.preventDefault()
		headerSearchBtn?.classList.remove('active')
		BODY.classList.remove('lock')
		fadeOut(searchModal, 200)
	})

	document.addEventListener('click', e => {
		const inSearch = e.target.closest('.search')
		const inSearchContent = e.target.closest('.search .cont')
		if (inSearch && !inSearchContent) {
			headerSearchBtn?.classList.remove('active')
			BODY.classList.remove('lock')
			fadeOut(searchModal, 200)
		}
	})

	// Fix. header
	const header = document.querySelector('header')
	headerInit = true
	headerHeight = header?.offsetHeight || 0
	const headerWrap = wrapElement(header, 'header_wrap')
	if (headerWrap) headerWrap.style.height = `${headerHeight}px`
	header?.classList.toggle('fixed', window.scrollY > 0)

	// Fix. mob. header
	const mobHeader = document.querySelector('.mob_header')
	mobHeaderInit = true
	mobHeaderHeight = mobHeader?.offsetHeight || 0
	const mobHeaderWrap = wrapElement(mobHeader, 'mob_header_wrap')
	if (mobHeaderWrap) mobHeaderWrap.style.height = `${mobHeaderHeight}px`
	mobHeader?.classList.toggle('fixed', window.scrollY > 0)
})

window.addEventListener('scroll', updateFixedHeadersOnScroll)

window.addEventListener('resize', () => {
	WH = window.innerHeight || document.documentElement.clientHeight || BODY.clientHeight

	const windowW = window.outerWidth
	if (typeof WW !== 'undefined' && WW !== windowW) {
		WW = window.innerWidth || document.documentElement.clientWidth || BODY.clientWidth

		setHeight(qsa('.solutions .item .name'))
		setHeight(qsa('.solutions .item .solution .desc'))
		setHeight(qsa('.solutions .item .result .desc'))

		const header = document.querySelector('header')
		const headerWrap = document.querySelector('.header_wrap')
		headerInit = false
		if (headerWrap) headerWrap.style.height = 'auto'

		setTimeout(() => {
			headerInit = true
			headerHeight = header?.offsetHeight || 0
			if (headerWrap) headerWrap.style.height = `${headerHeight}px`
			header?.classList.toggle('fixed', window.scrollY > 0)
		}, 100)

		const mobHeader = document.querySelector('.mob_header')
		const mobHeaderWrap = document.querySelector('.mob_header_wrap')
		mobHeaderInit = false
		if (mobHeaderWrap) mobHeaderWrap.style.height = 'auto'

		setTimeout(() => {
			mobHeaderInit = true
			mobHeaderHeight = mobHeader?.offsetHeight || 0
			if (mobHeaderWrap) mobHeaderWrap.style.height = `${mobHeaderHeight}px`
			mobHeader?.classList.toggle('fixed', window.scrollY > 0)
		}, 100)
	}
})
