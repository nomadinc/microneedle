(function () {
  'use strict';

  var section = document.querySelector('.section-novalift-sales-page');
  if (!section || section.dataset.novaliftInitialized === 'true') return;
  section.dataset.novaliftInitialized = 'true';

  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var cartAddUrl = root + 'cart/add.js';
  var cartChangeUrl = root + 'cart/change.js';
  var cartUrl = root + 'cart.js';
  var checkoutUrl = root + 'checkout';
  var overlay = section.querySelector('#nlCartOverlay');
  var drawer = section.querySelector('#nlCartDrawer');
  var closeButton = section.querySelector('#nlCloseCart');
  var cartBody = section.querySelector('#nlCartBody');
  var cartFooter = section.querySelector('#nlCartFooter');
  var subtotal = section.querySelector('#nlSubtotal');
  var savingsRow = section.querySelector('#nlSavingsRow');
  var checkoutButton = section.querySelector('#nlCheckoutBtn');
  var cartButton = section.querySelector('#nlCartIconBtn');
  var badge = section.querySelector('#nlCartBadge');
  var toast = section.querySelector('#nlToast');
  var toastMessage = section.querySelector('#nlToastMsg');
  var toastTimer;

  section.querySelectorAll('.acdn-content').forEach(function (answer) {
    answer.hidden = answer.previousElementSibling && !answer.previousElementSibling.classList.contains('accordion-open');
    answer.style.removeProperty('display');
  });

  function request(url, options) {
    return fetch(url, Object.assign({
      credentials: 'same-origin',
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
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  function updateBadge(count) {
    if (!badge) return;
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.classList.toggle('show', count > 0);
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
    if (cartButton) cartButton.focus();
  }

  function renderLoading() {
    if (!cartBody || !cartFooter) return;
    cartBody.innerHTML = '<div class="nl-loading"><div class="nl-spinner"></div></div>';
    cartFooter.style.display = 'none';
  }

  function renderCartError() {
    if (!cartBody || !cartFooter) return;
    cartBody.innerHTML = '<div class="nl-cart-empty"><p>Could not load cart.</p><span>Please refresh and try again.</span></div>';
    cartFooter.style.display = 'none';
  }

  function makeButton(label, action, key, quantity) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = action === 'remove' ? 'nl-remove-btn' : 'nl-qty-btn';
    button.dataset.action = action;
    button.dataset.key = key;
    if (typeof quantity === 'number') button.dataset.quantity = String(quantity);
    button.setAttribute('aria-label', label);
    button.textContent = action === 'increase' ? '+' : action === 'decrease' ? '−' : 'Remove';
    return button;
  }

  function renderItem(item) {
    var row = document.createElement('div');
    row.className = 'nl-cart-item';
    row.dataset.key = item.key;

    if (item.image) {
      var image = document.createElement('img');
      image.className = 'nl-item-img';
      image.src = item.image;
      image.alt = item.product_title || '';
      image.loading = 'lazy';
      row.appendChild(image);
    }

    var info = document.createElement('div');
    info.className = 'nl-item-info';
    var title = document.createElement('p');
    title.className = 'nl-item-title';
    title.textContent = item.product_title;
    info.appendChild(title);

    if (item.variant_title && item.variant_title !== 'Default Title') {
      var variant = document.createElement('p');
      variant.className = 'nl-item-variant';
      variant.textContent = item.variant_title;
      info.appendChild(variant);
    }

    var bottom = document.createElement('div');
    bottom.className = 'nl-item-bottom';
    var price = document.createElement('span');
    price.className = 'nl-item-price';
    price.textContent = formatMoney(item.final_line_price);
    bottom.appendChild(price);

    var controls = document.createElement('div');
    controls.className = 'nl-item-controls';
    controls.appendChild(makeButton('Decrease quantity', 'decrease', item.key, item.quantity - 1));
    var quantity = document.createElement('span');
    quantity.className = 'nl-qty-val';
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
    if (!cartBody || !cartFooter) return;
    updateBadge(cart.item_count);
    cartBody.replaceChildren();

    if (!cart.items || cart.items.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'nl-cart-empty';
      empty.innerHTML = '<p>Your cart is empty</p><span>Add a package above to get started.</span>';
      cartBody.appendChild(empty);
      cartFooter.style.display = 'none';
      return;
    }

    var items = document.createElement('div');
    items.className = 'nl-cart-items';
    cart.items.forEach(function (item) { items.appendChild(renderItem(item)); });
    cartBody.appendChild(items);
    subtotal.textContent = formatMoney(cart.total_price);
    if (savingsRow) savingsRow.style.display = 'none';
    checkoutButton.textContent = 'Proceed to Checkout — ' + formatMoney(cart.total_price);
    cartFooter.style.display = 'block';
  }

  function changeLine(key, quantity) {
    return request(cartChangeUrl, {
      method: 'POST',
      body: JSON.stringify({ id: key, quantity: quantity })
    });
  }

  section.addEventListener('click', function (event) {
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
      request(cartAddUrl, { method: 'POST', body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] }) })
        .then(function () {
          showToast('Added to cart!', false);
          openDrawer();
        })
        .catch(function (error) {
          showToast(error.description || 'Could not add to cart. Please try again.', true);
        })
        .finally(function () {
          addButton.removeAttribute('aria-busy');
          addButton.style.pointerEvents = '';
        });
      return;
    }

    var actionButton = event.target.closest('[data-action]');
    if (actionButton && cartBody.contains(actionButton)) {
      var quantity = actionButton.dataset.action === 'remove' ? 0 : Number(actionButton.dataset.quantity);
      var line = actionButton.closest('.nl-cart-item');
      if (line) line.classList.add('nl-updating');
      changeLine(actionButton.dataset.key, quantity)
        .then(renderCart)
        .catch(function () {
          if (line) line.classList.remove('nl-updating');
          showToast('Could not update cart. Please try again.', true);
        });
    }
  });

  if (cartButton) cartButton.addEventListener('click', openDrawer);
  if (closeButton) closeButton.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  if (checkoutButton) checkoutButton.addEventListener('click', function () { window.location.assign(checkoutUrl); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer && drawer.classList.contains('open')) closeDrawer();
  });

  section.querySelectorAll('.atc_btn').forEach(function (button) {
    if (!/^\d+$/.test((button.dataset.variantId || '').trim())) {
      button.setAttribute('aria-disabled', 'true');
      button.title = 'Configure this offer variant in the Theme Editor';
    }
  });

  getCart().then(function (cart) { updateBadge(cart.item_count); }).catch(function () {});
})();
