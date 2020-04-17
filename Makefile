CURL := curl --create-dirs
LINTER := npx eslint
RM := rm -rf

LANGS :=  $(wildcard lang/*.json)
VIEWS :=  $(wildcard views/*.ejs)

all: public/dist/combined.js public/dist/app.js public/dist/combined.css

public/dist/app.js: src/app.js babel.config.json public/verified_tokens.json $(LANGS) $(VIEWS)
	npx babel $< > $@

public/dist/combined.js: build/unpkg.com/core-js-bundle@3.6.5/minified.js \
	build/unpkg.com/jquery@3.3.1/dist/jquery.min.js \
	build/unpkg.com/@popperjs/core@2.2.2/dist/umd/popper.min.js \
	build/unpkg.com/tippy.js@6.1.1/dist/tippy-bundle.umd.min.js \
	build/unpkg.com/ejs@3.0.2/ejs.min.js \
	build/cdn.plot.ly/plotly-1.2.0.min.js \
	build/cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.9/jquery.autocomplete.min.js \
	build/cdn.jsdelivr.net/npm/jdenticon@2.1.1 \
	build/cdnjs.cloudflare.com/ajax/libs/bignumber.js/9.0.0/bignumber.min.js \
	build/cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js \
	build/unpkg.com/bchaddrjs-slp@0.2.8/dist/bchaddrjs-slp-0.2.8.min.js \
	build/unpkg.com/cytoscape@3.14.1/dist/cytoscape.min.js \
	build/unpkg.com/klayjs@0.4.1/klay.js \
	build/unpkg.com/clipboard@2.0.1/dist/clipboard.min.js \
	build/unpkg.com/i18next@19.4.1/dist/umd/i18next.min.js \
	build/unpkg.com/i18next-browser-languagedetector@4.0.2/i18nextBrowserLanguageDetector.min.js \
	src/lib/cytoscape-klay.js \
	src/lib/buffer.min.js \
	src/lib/qrcode.min.js \
	src/lib/EventSource.js \
	src/lib/jquery.nice-select.min.js
	cat $^ > $@

build/unpkg.com/core-js-bundle@3.6.5/minified.js:
	$(CURL) https://unpkg.com/core-js-bundle@3.6.5/minified.js -o $@

build/unpkg.com/jquery@3.3.1/dist/jquery.min.js:
	$(CURL) https://unpkg.com/jquery@3.3.1/dist/jquery.min.js -o $@

build/unpkg.com/@popperjs/core@2.2.2/dist/umd/popper.min.js:
	$(CURL) https://unpkg.com/@popperjs/core@2.2.2/dist/umd/popper.min.js -o $@

build/unpkg.com/tippy.js@6.1.1/dist/tippy-bundle.umd.min.js:
	$(CURL) https://unpkg.com/tippy.js@6.1.1/dist/tippy-bundle.umd.min.js -o $@

build/unpkg.com/ejs@3.0.2/ejs.min.js:
	$(CURL) https://unpkg.com/ejs@3.0.2/ejs.min.js -o $@

build/cdn.plot.ly/plotly-1.2.0.min.js:
	$(CURL) https://cdn.plot.ly/plotly-1.2.0.min.js -o $@

build/cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.9/jquery.autocomplete.min.js:
	$(CURL) https://cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.9/jquery.autocomplete.min.js -o $@

build/cdn.jsdelivr.net/npm/jdenticon@2.1.1:
	$(CURL) https://cdn.jsdelivr.net/npm/jdenticon@2.1.1 -o $@

build/cdnjs.cloudflare.com/ajax/libs/bignumber.js/9.0.0/bignumber.min.js:
	$(CURL) https://cdnjs.cloudflare.com/ajax/libs/bignumber.js/9.0.0/bignumber.min.js -o $@

build/cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js:
	$(CURL) https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js -o $@

build/unpkg.com/bchaddrjs-slp@0.2.8/dist/bchaddrjs-slp-0.2.8.min.js:
	$(CURL) https://unpkg.com/bchaddrjs-slp@0.2.8/dist/bchaddrjs-slp-0.2.8.min.js -o $@

build/unpkg.com/cytoscape@3.14.1/dist/cytoscape.min.js:
	$(CURL) https://unpkg.com/cytoscape@3.14.1/dist/cytoscape.min.js -o $@

build/unpkg.com/klayjs@0.4.1/klay.js:
	$(CURL) https://unpkg.com/klayjs@0.4.1/klay.js -o $@

build/unpkg.com/clipboard@2.0.1/dist/clipboard.min.js:
	$(CURL) https://unpkg.com/clipboard@2.0.1/dist/clipboard.min.js -o $@

build/unpkg.com/i18next@19.4.1/dist/umd/i18next.min.js:
	$(CURL) https://unpkg.com/i18next@19.4.1/dist/umd/i18next.min.js -o $@

build/unpkg.com/i18next-browser-languagedetector@4.0.2/i18nextBrowserLanguageDetector.min.js:
	$(CURL) https://unpkg.com/i18next-browser-languagedetector@4.0.2/i18nextBrowserLanguageDetector.min.js -o $@

public/dist/combined.css: src/css/nice-select.css src/css/explorer.css
	cat $^ > $@

.PHONY: clean lint

clean:
	$(RM) build/* public/dist/*

lint:
	$(LINTER) src/app.js
