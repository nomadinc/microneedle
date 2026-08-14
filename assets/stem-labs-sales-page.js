(function () {
  'use strict';

  if (window.StemLabsSalesPage) {
    window.StemLabsSalesPage.scan(document);
    return;
  }

  var controllers = new WeakMap();

  function getSections(scope) {
    var sections = [];
    if (scope && scope.matches && scope.matches('.section-stem-labs-sales-page')) sections.push(scope);
    if (scope && scope.querySelectorAll) {
      scope.querySelectorAll('.section-stem-labs-sales-page').forEach(function (section) {
        if (sections.indexOf(section) === -1) sections.push(section);
      });
    }
    return sections;
  }

  function createController(section) {
    var abortController = new AbortController();
    var signal = abortController.signal;
    var intervals = [];
    var timeouts = [];
    var destroyed = false;

    function listen(target, eventName, handler, options) {
      if (!target) return;
      var listenerOptions = Object.assign({}, options || {}, { signal: signal });
      target.addEventListener(eventName, handler, listenerOptions);
    }

    function addInterval(callback, delay) {
      var interval = window.setInterval(callback, delay);
      intervals.push(interval);
      return interval;
    }

    function addTimeout(callback, delay) {
      var timeout = window.setTimeout(callback, delay);
      timeouts.push(timeout);
      return timeout;
    }

    function clearTrackedTimeout(timeout) {
      window.clearTimeout(timeout);
      var index = timeouts.indexOf(timeout);
      if (index !== -1) timeouts.splice(index, 1);
    }

    function initCountdown() {
      var element = section.querySelector('#clockdiv');
      if (!element) return;

      var hours = parseInt(element.dataset.hours, 10) || 0;
      var minutes = parseInt(element.dataset.minutes, 10) || 0;
      var seconds = parseInt(element.dataset.seconds, 10) || 0;
      var totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      var hoursElement = element.querySelector('#hours');
      var minutesElement = element.querySelector('#minutes');
      var secondsElement = element.querySelector('#seconds');
      var timerInterval;

      if (!hoursElement || !minutesElement || !secondsElement) return;

      function pad(value) {
        return String(value).padStart(2, '0');
      }

      function render() {
        hoursElement.textContent = pad(Math.floor(totalSeconds / 3600));
        minutesElement.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
        secondsElement.textContent = pad(totalSeconds % 60);
      }

      function tick() {
        if (totalSeconds <= 0) {
          window.clearInterval(timerInterval);
          render();
          return;
        }
        totalSeconds -= 1;
        render();
      }

      render();
      timerInterval = addInterval(tick, 1000);
    }

    function initMobileNavigation() {
      var hamburger = section.querySelector('.header__hamburger');
      var mobileMenu = section.querySelector('#mobile-menu');
      if (!hamburger || !mobileMenu) return;

      function closeMenu() {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }

      listen(hamburger, 'click', function () {
        var isOpen = mobileMenu.classList.toggle('is-open');
        hamburger.classList.toggle('is-active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      });

      listen(document, 'click', function (event) {
        if (!hamburger.contains(event.target) && !mobileMenu.contains(event.target)) closeMenu();
      });

      section.querySelectorAll('.header__mobile-link').forEach(function (link) {
        listen(link, 'click', closeMenu);
      });
    }

    function initReviewSlider() {
      var slider = section.querySelector('.bar-section');
      if (!slider) return;

      var track = slider.querySelector('.bar-track');
      var cards = Array.from(slider.querySelectorAll('.bar-card'));
      var previousButton = slider.querySelector('.bar-nav--prev');
      var nextButton = slider.querySelector('.bar-nav--next');
      var dotsWrap = slider.querySelector('.bar-dots');
      var perPage = window.innerWidth <= 767 ? 1 : 3;
      var current = 0;
      var dots = [];
      var startX = 0;
      var endX = 0;

      if (!track || !cards.length || !previousButton || !nextButton || !dotsWrap) return;

      function totalPages() {
        return Math.max(1, Math.ceil(cards.length / perPage));
      }

      function goTo(index) {
        current = Math.max(0, Math.min(index, totalPages() - 1));
        var cardWidth = cards[0].offsetWidth;
        track.style.transform = 'translateX(-' + (current * perPage * (cardWidth + 16)) + 'px)';
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === current);
        });
      }

      function buildDots() {
        dotsWrap.replaceChildren();
        dots = [];
        for (var index = 0; index < totalPages(); index += 1) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'bar-dot' + (index === 0 ? ' is-active' : '');
          dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
          (function (targetIndex) {
            listen(dot, 'click', function () { goTo(targetIndex); });
          })(index);
          dotsWrap.appendChild(dot);
          dots.push(dot);
        }
      }

      buildDots();
      goTo(0);
      listen(previousButton, 'click', function () { goTo(current - 1); });
      listen(nextButton, 'click', function () { goTo(current + 1); });
      listen(window, 'resize', function () {
        var updatedPerPage = window.innerWidth <= 767 ? 1 : 3;
        if (updatedPerPage !== perPage) {
          perPage = updatedPerPage;
          buildDots();
        }
        goTo(0);
      });
      listen(track, 'touchstart', function (event) {
        startX = event.touches[0].clientX;
        endX = startX;
      }, { passive: true });
      listen(track, 'touchmove', function (event) {
        endX = event.touches[0].clientX;
      }, { passive: true });
      listen(track, 'touchend', function () {
        var distance = startX - endX;
        if (Math.abs(distance) > 50) goTo(distance > 0 ? current + 1 : current - 1);
        startX = 0;
        endX = 0;
      });
    }

    function initFaq() {
      var headings = Array.from(section.querySelectorAll('.acdn-heading'));

      function closeHeading(heading) {
        var answer = heading.nextElementSibling;
        heading.classList.remove('accordion-open');
        heading.setAttribute('aria-expanded', 'false');
        if (answer && answer.classList.contains('acdn-content')) answer.hidden = true;
      }

      function toggleHeading(heading) {
        var answer = heading.nextElementSibling;
        var isOpen = heading.getAttribute('aria-expanded') === 'true';
        headings.forEach(closeHeading);
        if (!isOpen && answer) {
          heading.classList.add('accordion-open');
          heading.setAttribute('aria-expanded', 'true');
          answer.hidden = false;
        }
      }

      headings.forEach(function (heading) {
        var answer = heading.nextElementSibling;
        var isOpen = heading.classList.contains('accordion-open');
        heading.setAttribute('role', 'button');
        heading.setAttribute('tabindex', '0');
        heading.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (answer && answer.classList.contains('acdn-content')) {
          answer.style.removeProperty('display');
          answer.hidden = !isOpen;
        }
        listen(heading, 'click', function () { toggleHeading(heading); });
        listen(heading, 'keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleHeading(heading);
          }
        });
      });
    }

    function initCart() {
      var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
      var cartAddUrl = root + 'cart/add.js';
      var cartChangeUrl = root + 'cart/change.js';
      var cartUrl = root + 'cart.js';
      var checkoutUrl = root + 'checkout';
      var overlay = section.querySelector('#slCartOverlay');
      var drawer = section.querySelector('#slCartDrawer');
      var closeButton = section.querySelector('#slCloseCart');
      var cartBody = section.querySelector('#slCartBody');
      var cartFooter = section.querySelector('#slCartFooter');
      var subtotal = section.querySelector('#slSubtotal');
      var savingsRow = section.querySelector('#slSavingsRow');
      var checkoutButton = section.querySelector('#slCheckoutBtn');
      var cartButton = section.querySelector('#slCartIconBtn');
      var badge = section.querySelector('#slCartBadge');
      var toast = section.querySelector('#slToast');
      var toastMessage = section.querySelector('#slToastMsg');
      var toastTimer;

      function request(url, options) {
        return fetch(url, Object.assign({
          credentials: 'same-origin',
          signal: signal,
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
        }, options || {})).then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok) throw data;
            return data;
          });
        });
      }

      function getCart() {
        return request(cartUrl);
      }

      function formatMoney(cents) {
        var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
        try {
          return new Intl.NumberFormat(document.documentElement.lang || 'en', {
            style: 'currency',
            currency: currency
          }).format(cents / 100);
        } catch (error) {
          return '$' + (cents / 100).toFixed(2);
        }
      }

      function showToast(message, isError) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.style.background = isError ? '#c0392b' : '#000';
        toast.classList.add('show');
        if (toastTimer) clearTrackedTimeout(toastTimer);
        toastTimer = addTimeout(function () { toast.classList.remove('show'); }, 2600);
      }

      function updateBadge(count) {
        if (!badge) return;
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.classList.toggle('show', count > 0);
      }

      function renderLoading() {
        if (!cartBody || !cartFooter) return;
        cartBody.innerHTML = '<div class="sl-loading"><div class="sl-spinner"></div></div>';
        cartFooter.style.display = 'none';
      }

      function renderCartError() {
        if (destroyed || !cartBody || !cartFooter) return;
        cartBody.innerHTML = '<div class="sl-cart-empty"><p>Could not load cart.</p><span>Please refresh and try again.</span></div>';
        cartFooter.style.display = 'none';
      }

      function openDrawer() {
        if (!overlay || !drawer) return;
        overlay.classList.add('active');
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        renderLoading();
        getCart().then(renderCart).catch(renderCartError);
      }

      function closeDrawer() {
        if (!overlay || !drawer) return;
        overlay.classList.remove('active');
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (cartButton && document.contains(cartButton)) cartButton.focus();
      }

      function makeButton(label, action, key, quantity) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = action === 'remove' ? 'sl-remove-btn' : 'sl-qty-btn';
        button.dataset.action = action;
        button.dataset.key = key;
        if (typeof quantity === 'number') button.dataset.quantity = String(quantity);
        button.setAttribute('aria-label', label);
        button.textContent = action === 'increase' ? '+' : action === 'decrease' ? '−' : 'Remove';
        return button;
      }

      function renderItem(item) {
        var row = document.createElement('div');
        row.className = 'sl-cart-item';
        row.dataset.key = item.key;
        if (item.image) {
          var image = document.createElement('img');
          image.className = 'sl-item-img';
          image.src = item.image;
          image.alt = item.product_title || '';
          image.loading = 'lazy';
          row.appendChild(image);
        }
        var info = document.createElement('div');
        info.className = 'sl-item-info';
        var title = document.createElement('p');
        title.className = 'sl-item-title';
        title.textContent = item.product_title;
        info.appendChild(title);
        if (item.variant_title && item.variant_title !== 'Default Title') {
          var variant = document.createElement('p');
          variant.className = 'sl-item-variant';
          variant.textContent = item.variant_title;
          info.appendChild(variant);
        }
        var bottom = document.createElement('div');
        bottom.className = 'sl-item-bottom';
        var price = document.createElement('span');
        price.className = 'sl-item-price';
        price.textContent = formatMoney(item.final_line_price);
        bottom.appendChild(price);
        var controls = document.createElement('div');
        controls.className = 'sl-item-controls';
        controls.appendChild(makeButton('Decrease quantity', 'decrease', item.key, item.quantity - 1));
        var quantity = document.createElement('span');
        quantity.className = 'sl-qty-val';
        quantity.textContent = item.quantity;
        controls.appendChild(quantity);
        controls.appendChild(makeButton('Increase quantity', 'increase', item.key, item.quantity + 1));
        controls.appendChild(makeButton('Remove ' + item.product_title, 'remove', item.key));
        bottom.appendChild(controls);
        info.appendChild(bottom);
        row.appendChild(info);
        return row;
      }

      function renderCart(cart) {
        if (destroyed || !cartBody || !cartFooter) return;
        updateBadge(cart.item_count);
        cartBody.replaceChildren();
        if (!cart.items || cart.items.length === 0) {
          var empty = document.createElement('div');
          empty.className = 'sl-cart-empty';
          empty.innerHTML = '<p>Your cart is empty</p><span>Add a package above to get started.</span>';
          cartBody.appendChild(empty);
          cartFooter.style.display = 'none';
          return;
        }
        var items = document.createElement('div');
        items.className = 'sl-cart-items';
        cart.items.forEach(function (item) { items.appendChild(renderItem(item)); });
        cartBody.appendChild(items);
        if (subtotal) subtotal.textContent = formatMoney(cart.total_price);
        if (savingsRow) savingsRow.style.display = 'none';
        if (checkoutButton) checkoutButton.textContent = 'Proceed to Checkout — ' + formatMoney(cart.total_price);
        cartFooter.style.display = 'block';
      }

      function changeLine(key, quantity) {
        return request(cartChangeUrl, {
          method: 'POST',
          body: JSON.stringify({ id: key, quantity: quantity })
        });
      }

      listen(section, 'click', function (event) {
        var scrollButton = event.target.closest('.btn_scorall');
        if (scrollButton) {
          event.preventDefault();
          var offers = section.querySelector('#package_sec');
          if (offers) offers.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        var addButton = event.target.closest('.atc_btn');
        if (addButton) {
          event.preventDefault();
          var variantId = addButton.dataset.variantId && addButton.dataset.variantId.trim();
          if (!/^\d+$/.test(variantId || '')) {
            showToast('Configure this offer variant in the Theme Editor.', true);
            return;
          }
          addButton.setAttribute('aria-busy', 'true');
          addButton.style.pointerEvents = 'none';
          request(cartAddUrl, {
            method: 'POST',
            body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] })
          }).then(function () {
            if (destroyed) return;
            showToast('Added to cart!', false);
            openDrawer();
          }).catch(function (error) {
            if (!destroyed) showToast(error.description || 'Could not add to cart. Please try again.', true);
          }).finally(function () {
            if (!destroyed) {
              addButton.removeAttribute('aria-busy');
              addButton.style.pointerEvents = '';
            }
          });
          return;
        }
        var actionButton = event.target.closest('[data-action]');
        if (actionButton && cartBody && cartBody.contains(actionButton)) {
          var quantity = actionButton.dataset.action === 'remove' ? 0 : Number(actionButton.dataset.quantity);
          var line = actionButton.closest('.sl-cart-item');
          if (line) line.classList.add('sl-updating');
          changeLine(actionButton.dataset.key, quantity).then(renderCart).catch(function () {
            if (line) line.classList.remove('sl-updating');
            if (!destroyed) showToast('Could not update cart. Please try again.', true);
          });
        }
      });

      listen(cartButton, 'click', openDrawer);
      listen(closeButton, 'click', closeDrawer);
      listen(overlay, 'click', closeDrawer);
      listen(checkoutButton, 'click', function () { window.location.assign(checkoutUrl); });
      listen(document, 'keydown', function (event) {
        if (event.key === 'Escape' && drawer && drawer.classList.contains('open')) closeDrawer();
      });

      section.querySelectorAll('.atc_btn').forEach(function (button) {
        if (!/^\d+$/.test((button.dataset.variantId || '').trim())) {
          button.setAttribute('aria-disabled', 'true');
          button.title = 'Configure this offer variant in the Theme Editor';
        }
      });
      getCart().then(function (cart) {
        if (!destroyed) updateBadge(cart.item_count);
      }).catch(function () {});
    }

    initCountdown();
    initMobileNavigation();
    initReviewSlider();
    initFaq();
    initCart();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        abortController.abort();
        intervals.forEach(window.clearInterval);
        timeouts.forEach(window.clearTimeout);
        document.body.style.overflow = '';
        section.removeAttribute('data-stem-labs-initialized');
      }
    };
  }

  function initialize(section) {
    if (!section || controllers.has(section)) return;
    section.dataset.stemLabsInitialized = 'true';
    controllers.set(section, createController(section));
  }

  function destroy(section) {
    var controller = controllers.get(section);
    if (!controller) return;
    controller.destroy();
    controllers.delete(section);
  }

  function scan(scope) {
    getSections(scope || document).forEach(initialize);
  }

  window.StemLabsSalesPage = { scan: scan, destroy: destroy };

  document.addEventListener('shopify:section:load', function (event) {
    getSections(event.target).forEach(initialize);
  });
  document.addEventListener('shopify:section:unload', function (event) {
    getSections(event.target).forEach(destroy);
  });

  scan(document);
})();
