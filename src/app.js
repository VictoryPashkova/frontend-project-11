import * as yup from 'yup';
import onChange from 'on-change';
import render from './view.js';

const urlValidation = (url, feeds, valid, invalid) => {
  const urlSchema = yup.string().url('Ссылка должна быть валидным URL').notOneOf(feeds, 'RSS уже существует');
  return urlSchema.validate(url)
    .then(() => valid())
    .catch((error) => invalid(error.message));
};

const app = () => {
  const state = {
    formState: '',
    formData: {
      inputLink: '',
      formFeeds: [],
    },
    errors: [],
    processState: 'filling',
  };

  const form = document.querySelector('.rss-form');
  const input = document.querySelector('.form-control');

  const watchedState = onChange(state, (path, value) => {
    const err = watchedState.errors[0];
    render(path, value, err);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.formState = '';
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    watchedState.formData.inputLink = inputData;
    const feeds = watchedState.formData.formFeeds;
    watchedState.errors = [];
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
        watchedState.errors.push(err);
        watchedState.formState = 'invalid';
        form.reset();
        input.focus();
      },
    );
  });
};

export default app;
