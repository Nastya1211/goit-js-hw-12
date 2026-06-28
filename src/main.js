import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import { getImagesByQuery } from './js/pixabay-api.js';
import {
  createGallery,
  clearGallery,
  showLoader,
  hideLoader,
  showLoadMoreButton,
  hideLoadMoreButton,
} from './js/render-functions.js';

const searchForm = document.querySelector('.form');
const loadMoreBtn = document.querySelector('.load-more-btn');

let searchQuery = '';
let page = 1;
const perPage = 15;

searchForm.addEventListener('submit', handleSearch);
loadMoreBtn.addEventListener('click', handleLoadMore);

async function handleSearch(event) {
  event.preventDefault();

  searchQuery = event.currentTarget.elements.searchQuery.value.trim();
  page = 1;

  if (searchQuery === '') {
    iziToast.warning({
      title: 'Warning',
      message: 'Please enter a search query!',
      position: 'topRight',
    });
    return;
  }

  clearGallery();
  hideLoadMoreButton(); // Обов'язково ховаємо кнопку при новому пошуку
  showLoader();

  try {
    const data = await getImagesByQuery(searchQuery, page);

    if (data.hits.length === 0) {
      iziToast.error({
        title: 'Error',
        message:
          'Sorry, there are no images matching your search query. Please try again!',
        position: 'topRight',
      });
      return;
    }

    createGallery(data.hits);

    // Розраховуємо загальну кількість сторінок
    const totalPages = Math.ceil(data.totalHits / perPage);

    // ПУНКТ 1: Якщо результати знайшлися, але вони всі вміщуються на 1-шу сторінку
    if (page >= totalPages) {
      hideLoadMoreButton(); // Перестраховка: ховаємо кнопку
      iziToast.info({
        title: 'End',
        message: "We're sorry, but you've reached the end of search results.",
        position: 'topRight',
      });
    } else {
      // Якщо є наступні сторінки — показуємо кнопку
      showLoadMoreButton();
    }
  } catch (error) {
    iziToast.error({
      title: 'Error',
      message: 'Something went wrong. Please try again later.',
      position: 'topRight',
    });
  } finally {
    hideLoader();
    searchForm.reset();
  }
}

async function handleLoadMore() {
  page += 1;
  hideLoadMoreButton(); // Ховаємо кнопку на час завантаження
  showLoader();

  try {
    const data = await getImagesByQuery(searchQuery, page);
    createGallery(data.hits);
    smoothScroll();

    const totalPages = Math.ceil(data.totalHits / perPage);

    // ПУНКТ 2: Перевірка при досягненні останньої сторінки через "Load more"
    if (page >= totalPages) {
      hideLoadMoreButton(); // 👈 КРИТИЧНО: Явно ховаємо кнопку, щоб вона не висіла!
      iziToast.info({
        title: 'End',
        message: "We're sorry, but you've reached the end of search results.",
        position: 'topRight',
      });
    } else {
      showLoadMoreButton(); // Якщо сторінки ще є, повертаємо кнопку назад
    }
  } catch (error) {
    iziToast.error({
      title: 'Error',
      message: 'Failed to fetch more images.',
      position: 'topRight',
    });
    showLoadMoreButton(); // Якщо впала помилка мережі, даємо шанс натиснути ще раз
  } finally {
    hideLoader();
  }
}

function smoothScroll() {
  const firstCard = document.querySelector('.gallery-item');
  if (firstCard) {
    const { height: cardHeight } = firstCard.getBoundingClientRect();
    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });
  }
}
