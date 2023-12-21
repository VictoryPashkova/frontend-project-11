import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import render from './view.js';
import resources from './locales/index.js';

yup.setLocale({
  string: {
    url: () => ({ key: 'errorInvalidUrl' }),
  },
  mixed: {
    notOneOf: () => ({ key: 'errorDoubUrl' }),
  },
});

const urlValidation = (url, feeds, valid, invalid) => {
  const urlSchema = yup.string().url().notOneOf(feeds);
  return urlSchema.validate(url)
    .then(() => valid())
    .catch((error) => {
      invalid(error.errors[0]);
    });
};

const app = (i18n) => {
  const state = {
    formState: '',
    formData: {
      inputLink: '',
      formFeeds: [],
    },
    errorsKeys: [],
    processState: 'filling',
  };

  const form = document.querySelector('.rss-form');
  const input = document.querySelector('.form-control');

  const watchedState = onChange(state, (path, value) => {
    const errKey = watchedState.errorsKeys[0];
    const errMessage = i18n.t(errKey);
    const successMessage = i18n.t('successLoadedRSS');
    render(path, value, errMessage, successMessage);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.formState = '';
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    watchedState.formData.inputLink = inputData;
    const feeds = watchedState.formData.formFeeds;
    watchedState.errorsKeys = [];
    urlValidation(
      inputData,
      feeds,
      () => {
        watchedState.formState = 'valid';
        watchedState.formData.formFeeds.push(watchedState.formData.inputLink);
        form.reset();
        input.focus();
      },
      (err) => {
        watchedState.errorsKeys.push(err.key);
        watchedState.formState = 'invalid';
        form.reset();
        input.focus();
      },
    );
  });
};

const runApp = () => {
  const i18n = i18next.createInstance({
    lng: 'ru',
    resources,
  });

  i18n
    .init()
    .then(() => {
      app(i18n);
    })
    .catch((error) => {
      console.error('Ошибка инициализации i18n:', error);
    });
};

export default runApp;
