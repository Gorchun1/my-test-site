let cart = [];

function addToCart(productName) {
  cart.push(productName);
  document.getElementById('cart-count').textContent = cart.length;
}

document.getElementById('cart-btn').addEventListener('click', function() {
  const cartModal = document.getElementById('cart-modal');
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    cartItems.appendChild(li);
  });
  cartModal.style.display = 'flex';
});

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

// Анимация при прокрутке
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.animate').forEach(el => observer.observe(el));
