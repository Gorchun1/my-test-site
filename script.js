const products = [
    {
        id: 1,
        name: "Колготки 20 DEN",
        price: 299,
        image: "https://via.placeholder.com/300x400.png?text=Колготки+20+DEN"
    },
    {
        id: 2,
        name: "Колготки 40 DEN",
        price: 399,
        image: "https://via.placeholder.com/300x400.png?text=Колготки+40+DEN"
    },
    {
        id: 3,
        name: "Тёплые зимние колготки",
        price: 599,
        image: "https://via.placeholder.com/300x400.png?text=Зимние+Колготки"
    }
];

let cartCount = 0;

const productsContainer = document.getElementById('products');

products.forEach(product => {
    const productEl = document.createElement('div');
    productEl.classList.add('product');
    productEl.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.price} ₽</p>
        <button onclick="addToCart()">В корзину</button>
    `;
    productsContainer.appendChild(productEl);
});

function addToCart() {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
}
