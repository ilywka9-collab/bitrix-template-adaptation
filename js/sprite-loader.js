(function () {
	function getCurrentScript() {
		if (document.currentScript) return document.currentScript
		var scripts = document.getElementsByTagName('script')
		return scripts.length ? scripts[scripts.length - 1] : null
	}

	function resolveSpriteUrl() {
		var script = getCurrentScript()
		try {
			if (script && script.src) return new URL('../images/sprite.svg', script.src).toString()
			return new URL('images/sprite.svg', window.location.href).toString()
		} catch (e) {
			var base = window.location.href.replace(/[^/]*$/, '')
			return base + 'images/sprite.svg'
		}
	}

	var SPRITE_URL = resolveSpriteUrl()

	function markLoaded() {
		if (document.getElementById('svg-sprite-loaded')) return
		var marker = document.createElement('meta')
		marker.id = 'svg-sprite-loaded'
		document.head.appendChild(marker)
	}

	function sanitizeSvg(svg) {
		var forbidden = svg.querySelectorAll('script, foreignObject')
		var i
		for (i = 0; i < forbidden.length; i++) forbidden[i].parentNode.removeChild(forbidden[i])

		var nodes = svg.querySelectorAll('*')
		for (i = 0; i < nodes.length; i++) {
			var node = nodes[i]
			var attrs = node.attributes
			for (var a = attrs.length - 1; a >= 0; a--) {
				var attr = attrs[a]
				if (/^on/i.test(attr.name)) {
					node.removeAttribute(attr.name)
					continue
				}
				var isHrefAttr = attr.name === 'href' || attr.name === 'xlink:href'
				var value = (attr.value || '').replace(/^\s+|\s+$/g, '')
				if (isHrefAttr && /^javascript:/i.test(value)) node.removeAttribute(attr.name)
			}
		}

		svg.setAttribute('aria-hidden', 'true')
		svg.setAttribute('focusable', 'false')
		svg.style.position = 'absolute'
		svg.style.width = '0'
		svg.style.height = '0'
		svg.style.overflow = 'hidden'
	}

	function injectSprite(text) {
		var parser = new DOMParser()
		var doc = parser.parseFromString(text, 'image/svg+xml')
		var svg = null

		if (!doc.querySelector('parsererror')) {
			svg = doc.querySelector('svg')
		}

		// Fallback: tolerate malformed SVG by parsing as HTML fragment.
		if (!svg) {
			var container = document.createElement('div')
			container.innerHTML = text
			svg = container.querySelector('svg')
		}

		if (!svg || !document.body) return false

		sanitizeSvg(svg)
		if (document.body.firstChild) document.body.insertBefore(svg, document.body.firstChild)
		else document.body.appendChild(svg)
		markLoaded()
		return true
	}

	function loadViaXhr(onDone) {
		try {
			var xhr = new XMLHttpRequest()
			xhr.open('GET', SPRITE_URL, true)
			xhr.overrideMimeType('image/svg+xml')
			xhr.onload = function () {
				var ok = (xhr.status >= 200 && xhr.status < 300) || xhr.status === 0
				onDone(ok ? xhr.responseText : '')
			}
			xhr.onerror = function () {
				onDone('')
			}
			xhr.send()
		} catch (e) {
			onDone('')
		}
	}

	function loadViaFetch(onDone) {
		if (!window.fetch) {
			onDone('')
			return
		}
		fetch(SPRITE_URL, { credentials: 'same-origin' })
			.then(function (response) {
				if (!response || !response.ok) return ''
				return response.text()
			})
			.then(function (text) {
				onDone(text || '')
			})
			.catch(function () {
				onDone('')
			})
	}

	function setUseRef(node, value) {
		try {
			node.setAttribute('href', value)
			node.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', value)
		} catch (e) {
			node.setAttribute('href', value)
			node.setAttribute('xlink:href', value)
		}
	}

	function fallbackToExternalUse() {
		var uses = document.getElementsByTagName('use')
		for (var i = 0; i < uses.length; i++) {
			var use = uses[i]
			var ref = use.getAttribute('href') || use.getAttribute('xlink:href') || ''
			if (!ref || ref.charAt(0) !== '#') continue
			setUseRef(use, SPRITE_URL + ref)
		}
	}

	function loadSprite() {
		if (!document.body || document.getElementById('svg-sprite-loaded')) return

		if (window.__SVG_SPRITE_TEXT && injectSprite(window.__SVG_SPRITE_TEXT)) return

		loadViaFetch(function (text) {
			if (text && injectSprite(text)) return
			loadViaXhr(function (fallbackText) {
				if (fallbackText && injectSprite(fallbackText)) return
				fallbackToExternalUse()
				if (window.console && console.warn) {
					console.warn('SVG sprite injection failed:', SPRITE_URL)
				}
			})
		})
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', loadSprite)
	} else {
		loadSprite()
	}
})()
