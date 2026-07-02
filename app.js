// =====================================================
// 1. REDUX — state management (works fine without React,
//    Redux is just a plain JS state container)
// =====================================================

// Action types
const ADD_ITEM = "ADD_ITEM";
const REMOVE_ITEM = "REMOVE_ITEM";
const INCREMENT = "INCREMENT";
const DECREMENT = "DECREMENT";
const CLEAR_CART = "CLEAR_CART";

// Action creators
const addItem = (id) => ({ type: ADD_ITEM, payload: id });
const removeItem = (id) => ({ type: REMOVE_ITEM, payload: id });
const increment = (id) => ({ type: INCREMENT, payload: id });
const decrement = (id) => ({ type: DECREMENT, payload: id });
const clearCart = () => ({ type: CLEAR_CART });

// Initial state: { items: { productId: quantity } }
const initialState = { items: {} };

function cartReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_ITEM: {
      const id = action.payload;
      const currentQty = state.items[id] || 0;
      return {
        ...state,
        items: { ...state.items, [id]: currentQty + 1 }
      };
    }
    case INCREMENT: {
      const id = action.payload;
      return {
        ...state,
        items: { ...state.items, [id]: (state.items[id] || 0) + 1 }
      };
    }
    case DECREMENT: {
      const id = action.payload;
      const nextQty = (state.items[id] || 0) - 1;
      const items = { ...state.items };
      if (nextQty <= 0) {
        delete items[id];
      } else {
        items[id] = nextQty;
      }
      return { ...state, items };
    }
    case REMOVE_ITEM: {
      const items = { ...state.items };
      delete items[action.payload];
      return { ...state, items };
    }
    case CLEAR_CART:
      return initialState;
    default:
      return state;
  }
}

// Create the Redux store (Redux is loaded globally via the CDN script tag)
const store = Redux.createStore(cartReducer);

// =====================================================
// 2. jQuery — rendering + DOM events
// =====================================================

$(function () {
  const $grid = $("#product-grid");
  const $cartItems = $("#cart-items");
  const $cartEmpty = $("#cart-empty");
  const $cartCount = $("#cart-count");
  const $cartItemCount = $("#cart-item-count");
  const $cartTotal = $("#cart-total");
  const $toast = $("#toast");

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const money = (n) => `$${n.toFixed(2)}`;

  // ---- render the shop grid (runs once) ----
  function renderProducts() {
    const html = PRODUCTS.map(
      (p) => `
      <article class="card" data-id="${p.id}">
        <div class="card-img">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <span class="card-tag">${p.tag}</span>
        </div>
        <div class="card-body">
          <h3>${p.name}</h3>
          <p class="card-price">${money(p.price)}</p>
          <button class="add-btn" data-id="${p.id}">Add to list</button>
        </div>
      </article>`
    ).join("");
    $grid.html(html);
  }

  // ---- render the cart drawer (runs on every state change) ----
  function renderCart() {
    const state = store.getState();
    const entries = Object.entries(state.items); // [ [id, qty], ... ]

    // total quantity for the header badge
    const totalQty = entries.reduce((sum, [, qty]) => sum + qty, 0);
    $cartCount.text(totalQty);
    $cartItemCount.text(totalQty);

    // total price
    const totalPrice = entries.reduce((sum, [id, qty]) => {
      const product = findProduct(id);
      return sum + (product ? product.price * qty : 0);
    }, 0);
    $cartTotal.text(money(totalPrice));

    // empty state
    if (entries.length === 0) {
      $cartItems.find(".cart-line").remove();
      $cartEmpty.show();
      return;
    }
    $cartEmpty.hide();

    const html = entries
      .map(([id, qty]) => {
        const p = findProduct(id);
        if (!p) return "";
        return `
        <div class="cart-line" data-id="${id}">
          <img src="${p.img}" alt="${p.name}">
          <div class="cart-line-info">
            <p class="cart-line-name">${p.name}</p>
            <p class="cart-line-price">${money(p.price)}</p>
            <div class="qty-controls">
              <button class="qty-btn dec" data-id="${id}">−</button>
              <span>${qty}</span>
              <button class="qty-btn inc" data-id="${id}">+</button>
            </div>
          </div>
          <button class="remove-btn" data-id="${id}" aria-label="Remove">✕</button>
        </div>`;
      })
      .join("");

    $cartItems.find(".cart-line").remove();
    $cartEmpty.after(html);
  }

  // Redux subscribe: whenever the store changes, re-render the cart.
  // This is the "redux drives the UI" pattern — jQuery just paints it.
  store.subscribe(renderCart);

  // ---- toast helper ----
  let toastTimer;
  function showToast(text) {
    clearTimeout(toastTimer);
    $toast.text(text).addClass("show");
    toastTimer = setTimeout(() => $toast.removeClass("show"), 1500);
  }

  // ---- event delegation (jQuery) ----
  $grid.on("click", ".add-btn", function () {
    const id = $(this).data("id");
    store.dispatch(addItem(id));
    showToast(`${findProduct(id).name} added ✓`);
  });

  $cartItems.on("click", ".qty-btn.inc", function () {
    store.dispatch(increment($(this).data("id")));
  });

  $cartItems.on("click", ".qty-btn.dec", function () {
    store.dispatch(decrement($(this).data("id")));
  });

  $cartItems.on("click", ".remove-btn", function () {
    store.dispatch(removeItem($(this).data("id")));
  });

  $("#checkout-btn").on("click", function () {
    const state = store.getState();
    if (Object.keys(state.items).length === 0) {
      showToast("Your list is empty");
      return;
    }
    showToast("Checked out! Happy trails 🥾");
    store.dispatch(clearCart());
    closeCart();
  });

  // ---- cart drawer open/close ----
  function openCart() {
    $("#cart-drawer").addClass("open");
    $("#cart-overlay").addClass("show");
  }
  function closeCart() {
    $("#cart-drawer").removeClass("open");
    $("#cart-overlay").removeClass("show");
  }
  $("#cart-toggle").on("click", openCart);
  $("#cart-close, #cart-overlay").on("click", closeCart);

  // ---- init ----
  renderProducts();
  renderCart();
});
