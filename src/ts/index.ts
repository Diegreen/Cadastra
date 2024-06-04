import { Product } from "./Product";

const serverUrl = "http://localhost:5000/products";

let products: Product[] = []
let cartItemCount = 0;

const priceRanges = [
  { label: "de R$0 até R$50", min: 0, max: 50 },
  { label: "de R$51 até R$150", min: 51, max: 150 },
  { label: "de R$151 até R$300", min: 151, max: 300 },
  { label: "de R$301 até R$500", min: 301, max: 500 },
  { label: "a partir de R$500", min: 501, max: Infinity }
];

let selectedColorsMobile: Set<string> = new Set();
let selectedPriceRangesMobile: { min: number; max: number }[] = [];
let selectedSizesMobile: Set<string> = new Set();

let selectedColorsDesktop: Set<string> = new Set();
let selectedPriceRangesDesktop: { min: number; max: number }[] = [];
let selectedSizesDesktop: Set<string> = new Set();

type FilterType = 'color' | 'size' | 'price';

let currentProductIndex = 0;
let productsPerPage = 9;

//main
async function main() {
  try {
    products = await fetchProducts(serverUrl);
    console.log("Produtos carregados:", products);

    const initialProductCount = window.innerWidth < 768 ? 4 : 9;
    productsPerPage = initialProductCount;
    
    renderProducts(products.slice(0, initialProductCount)); 
    currentProductIndex = initialProductCount;

    setupLoadMoreButton();
    setupFilterAndOrderTriggers();
    setupFilterToggleButtons();
    setupOrderSelect();

    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        window.location.reload(); 
      }
    });
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
  }
}

//fetch dos produtos
async function fetchProducts(url: string): Promise<Product[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro: ${response.statusText}`);
    }
    const data: Product[] = await response.json();
    products = data;
    console.log("Dados recebidos do servidor:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    throw error;
  }
}

// Função para adicionar itens ao carrinho e atualizar o contador
function addToCart(product: Product) {
  cartItemCount++;
  updateCartCount();
  console.log(`Produto ${product.name} adicionado ao carrinho. Total de itens: ${cartItemCount}`);
}

function updateCartCount() {
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = cartItemCount.toString();
  }
}

function setupLoadMoreButton() {
  const loadMoreButton = document.getElementById('load-more');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
      const nextProducts = products.slice(currentProductIndex, currentProductIndex + productsPerPage);
      renderProducts(nextProducts, true);
      currentProductIndex += productsPerPage;

      if (currentProductIndex >= products.length) {
        loadMoreButton.style.display = 'none';
      }
    });
  }
}

//renderização dos produtos
function renderProducts(products: Product[], append: boolean = false) {
  const productsContainer = document.getElementById('products-container');
  if (!productsContainer) {
    console.error("Elemento 'products-container' não encontrado");
    return;
  }

  if (!append) {
    productsContainer.innerHTML = '';
  }

  console.log("Renderizando produtos...");

  products.forEach(product => {
    console.log("Renderizando produto:", product);

    const productDiv = document.createElement('div');
    productDiv.classList.add('product-item');

    const productImage = document.createElement('img');
    productImage.src = product.image;
    productDiv.appendChild(productImage);

    const productName = document.createElement('h2');
    productName.textContent = product.name.toUpperCase();
    productDiv.appendChild(productName);

    const productPrice = document.createElement('p');
    productPrice.textContent = `R$ ${product.price.toFixed(2)}`;
    productPrice.classList.add('price');
    productDiv.appendChild(productPrice);

    // Calcular e exibir parcelamento
    const productParcelamento = document.createElement('p');
    productParcelamento.classList.add('parcelamento');
    if (Array.isArray(product.parcelamento) && product.parcelamento.length > 0) {
      const minParcel = Math.min(...product.parcelamento);
      const parcelaValue = product.price / minParcel;
      productParcelamento.textContent = `Até ${minParcel}x de R$ ${parcelaValue.toFixed(2)}`;
    }
    productDiv.appendChild(productParcelamento);

    const buyButton = document.createElement('button');
    buyButton.textContent = `COMPRAR`;
    buyButton.addEventListener('click', () => addToCart(product));
    productDiv.appendChild(buyButton);

    productsContainer.appendChild(productDiv);
  });

  console.log("Produtos renderizados:", productsContainer.innerHTML);
}

// Função para configurar os botões de filtro e ordenação
function setupFilterAndOrderTriggers() {
  const buttonFilterMobile = document.getElementById('filterTrigger');
  const buttonOrderMobile = document.getElementById('orderTrigger');
  const formFilterMobile = document.getElementById('form');
  const formOrderMobile = document.getElementById('form-order');
  const closeFilterMobile = document.getElementById('closeFilter');
  const closeOrderMobile = document.getElementById('closeOrder');
  const asideElement = document.querySelector('aside');

  buttonFilterMobile.addEventListener('click', (event) => {
    event.preventDefault();
    formFilterMobile.classList.toggle('active');
    asideElement.classList.toggle('active');
  });

  buttonOrderMobile.addEventListener('click', (event) => {
    event.preventDefault();
    formOrderMobile.classList.toggle('active');
    asideElement.classList.toggle('active');
  });

  closeFilterMobile.addEventListener('click', (event) => {
    event.preventDefault();
    formFilterMobile.classList.remove('active');
    asideElement.classList.remove('active');
  });

  closeOrderMobile.addEventListener('click', (event) => {
    event.preventDefault();
    formOrderMobile.classList.remove('active');
    asideElement.classList.remove('active');
  });

  
  renderFilterOptions('color', 'desktop-color-container', 'desktop');
  renderFilterOptions('size', 'desktop-size-container', 'desktop');
  renderFilterOptions('price', 'desktop-price-container', 'desktop');

 
  const orderRecentMobile = document.getElementById('orderTriggerRecent');
  const orderHighPriceMobile = document.getElementById('orderTriggerHighPrice');
  const orderLowPriceMobile = document.getElementById('orderTriggerLowPrice');

  if (orderRecentMobile) {
    orderRecentMobile.addEventListener('click', () => {
      sortProducts('recent');
      asideElement.classList.remove('active'); 
      formOrderMobile.classList.remove('active');
    });
  }

  if (orderHighPriceMobile) {
    orderHighPriceMobile.addEventListener('click', () => {
      sortProducts('high-price');
      asideElement.classList.remove('active'); 
      formOrderMobile.classList.remove('active');
    });
  }

  if (orderLowPriceMobile) {
    orderLowPriceMobile.addEventListener('click', () => {
      sortProducts('low-price');
      asideElement.classList.remove('active'); 
      formOrderMobile.classList.remove('active');
    });
  }
}

// Função para configurar a visibilidade das seções de filtros no mobile
function setupFilterToggleButtons() {
  const colorButton = document.getElementById('filterTriggerColor');
  const sizeButton = document.getElementById('filterTriggerSize');
  const priceButton = document.getElementById('filterTriggerPrice');

  const colorContainer = document.getElementById('color-container') as HTMLElement;
  const sizeContainer = document.getElementById('size-container') as HTMLElement;
  const priceContainer = document.getElementById('price-container') as HTMLElement;

  if (colorButton && sizeButton && priceButton) {
    colorButton.addEventListener('click', (event) => {
      event.preventDefault();
      renderFilterOptions('color', 'color-container', 'mobile');
      toggleVisibility(colorContainer);
    });

    sizeButton.addEventListener('click', (event) => {
      event.preventDefault();
      renderFilterOptions('size', 'size-container', 'mobile');
      toggleVisibility(sizeContainer);
    });

    priceButton.addEventListener('click', (event) => {
      event.preventDefault();
      renderFilterOptions('price', 'price-container', 'mobile');
      toggleVisibility(priceContainer);
    });
  }
}

function toggleVisibility(container: HTMLElement) {
  if (container.style.display === 'block') {
    container.style.display = 'none';
  } else {
    container.style.display = 'block';
  }
}

// Função para renderizar opções de filtro
function renderFilterOptions(filterType: FilterType, containerId: string, context: 'mobile' | 'desktop') {
  const productsContainer = document.getElementById(containerId);
  if (!productsContainer) return;

  productsContainer.innerHTML = '';

  if (filterType === 'price') {
    priceRanges.forEach(priceRange => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('price-item');

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = priceRange.label;
      itemDiv.appendChild(input);

      const label = document.createElement('label');
      label.textContent = priceRange.label;
      itemDiv.appendChild(label);

      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (context === 'mobile') {
          if (target.checked) {
            selectedPriceRangesMobile.push({ min: priceRange.min, max: priceRange.max });
          } else {
            selectedPriceRangesMobile = selectedPriceRangesMobile.filter(range => range.min !== priceRange.min || range.max !== priceRange.max);
          }
        } else {
          if (target.checked) {
            selectedPriceRangesDesktop.push({ min: priceRange.min, max: priceRange.max });
          } else {
            selectedPriceRangesDesktop = selectedPriceRangesDesktop.filter(range => range.min !== priceRange.min || range.max !== priceRange.max);
          }
        }
        console.log('Selected price ranges:', context === 'mobile' ? selectedPriceRangesMobile : selectedPriceRangesDesktop);
        applyFilters(context);
      });

      productsContainer.appendChild(itemDiv);
    });
  } else if (filterType === 'size') {
    const sizes = new Set<string>();

    products.forEach(product => {
      if (Array.isArray(product.size)) {
        product.size.forEach(size => sizes.add(size));
      } else {
        sizes.add(product.size);
      }
    });

    sizes.forEach(size => {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('size-button');
      button.textContent = size;

      button.addEventListener('click', () => {
        if (context === 'mobile') {
          if (selectedSizesMobile.has(size)) {
            selectedSizesMobile.delete(size);
            button.classList.remove('selected');
          } else {
            selectedSizesMobile.add(size);
            button.classList.add('selected');
          }
        } else {
          if (selectedSizesDesktop.has(size)) {
            selectedSizesDesktop.delete(size);
            button.classList.remove('selected');
          } else {
            selectedSizesDesktop.add(size);
            button.classList.add('selected');
          }
        }
        console.log('Selected sizes:', context === 'mobile' ? Array.from(selectedSizesMobile) : Array.from(selectedSizesDesktop));
        applyFilters(context);
      });

      productsContainer.appendChild(button);
    });
  } else {
    const colors = new Set<string>();

    products.forEach(product => {
      colors.add(product.color);
    });

    colors.forEach(color => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('color-item');

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = color;
      itemDiv.appendChild(input);

      const label = document.createElement('label');
      label.textContent = color;
      itemDiv.appendChild(label);

      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (context === 'mobile') {
          if (target.checked) {
            selectedColorsMobile.add(target.value);
          } else {
            selectedColorsMobile.delete(target.value);
          }
        } else {
          if (target.checked) {
            selectedColorsDesktop.add(target.value);
          } else {
            selectedColorsDesktop.delete(target.value);
          }
        }
        console.log('Selected colors:', context === 'mobile' ? Array.from(selectedColorsMobile) : Array.from(selectedColorsDesktop));
        applyFilters(context);
      });

      productsContainer.appendChild(itemDiv);
    });
  }
}

// Função para aplicar filtros
function applyFilters(context: 'mobile' | 'desktop') {
  let filteredProducts = products.filter(product => {
    const productPrice = product.price;

    let isColorMatch = true;
    let isSizeMatch = true;
    let isPriceMatch = true;

    if (context === 'mobile') {
      isColorMatch = selectedColorsMobile.size === 0 || selectedColorsMobile.has(product.color);
      isSizeMatch = selectedSizesMobile.size === 0 || (Array.isArray(product.size) ? product.size.some(size => selectedSizesMobile.has(size)) : selectedSizesMobile.has(product.size));
      isPriceMatch = selectedPriceRangesMobile.length === 0 || selectedPriceRangesMobile.some(range => {
        return productPrice >= range.min && productPrice <= range.max;
      });
    } else {
      isColorMatch = selectedColorsDesktop.size === 0 || selectedColorsDesktop.has(product.color);
      isSizeMatch = selectedSizesDesktop.size === 0 || (Array.isArray(product.size) ? product.size.some(size => selectedSizesDesktop.has(size)) : selectedSizesDesktop.has(product.size));
      isPriceMatch = selectedPriceRangesDesktop.length === 0 || selectedPriceRangesDesktop.some(range => {
        return productPrice >= range.min && productPrice <= range.max;
      });
    }

    console.log(`Produto: ${product.name}, Preço: ${productPrice}, Cor: ${product.color}, Tamanho: ${product.size}, isColorMatch: ${isColorMatch}, isSizeMatch: ${isSizeMatch}, isPriceMatch: ${isPriceMatch}`);

    return isColorMatch && isSizeMatch && isPriceMatch;
  });

  renderProducts(filteredProducts);
}

// Função para ordenar produtos
function sortProducts(criteria: string) {
  let sortedProducts = [...products];

  if (criteria === 'recent') {
    sortedProducts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (criteria === 'high-price') {
    sortedProducts.sort((a, b) => b.price - a.price);
  } else if (criteria === 'low-price') {
    sortedProducts.sort((a, b) => a.price - b.price);
  }

  renderProducts(sortedProducts, false);
}

// Função para configurar a seleção de ordenação
function setupOrderSelect() {
  const orderSelect = document.getElementById('order-select') as HTMLSelectElement;
  if (orderSelect) {
    orderSelect.addEventListener('change', () => {
      const criteria = orderSelect.value;
      console.log(`Ordenando por: ${criteria}`);
      sortProducts(criteria);
    });
  }
}

// Inicialização dos filtros ao carregar a página
document.addEventListener("DOMContentLoaded", main);