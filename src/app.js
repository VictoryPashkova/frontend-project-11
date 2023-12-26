import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import {renderIsValid, renderNotValid, renderFeedsList, renderPostsList, renderInitial, renderNetworkErr} from './view.js';
import resources from './locales/index.js';
import axios from 'axios';
import {getProxingRequest, getParsedData} from './parser.js';
import _ from 'lodash';
import uniqueId from 'lodash/uniqueId.js';


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

const createPostList = (postsData, feedId = null) => {
    const postsList = [];
    postsData.posts.forEach((item) => {
        const postName = item.querySelector('title').textContent;
        const postLink = item.querySelector('link').textContent;
        postsList.push([feedId, postLink, postName]);
    });
   return postsList;
};

const app = (i18n, state) => {

  const form = document.querySelector('.rss-form');
  const input = document.querySelector('.form-control');

  const watchedState = onChange(state, (path, value) => {
    if (path === 'formState') {
        if (value === 'valid') {
          const successMessage = i18n.t('successLoadedRSS');
          renderIsValid(successMessage);
        } else if (value === 'invalid') {
            const errKey = watchedState.errorsKeys[0];
            const errMessage = i18n.t(errKey);
            renderNotValid(errMessage);
        }
      }
      if (path === 'feedsList') {
        const feedTitle = i18n.t('feedTitle');
        renderFeedsList(value, feedTitle);
      }
      if (path === 'postsList') {
        const viewButtonText = i18n.t('viewButtonText')
        const postTitle = i18n.t('postTitle');
        renderPostsList(value, postTitle, viewButtonText);
      }
      if (path === 'processState') {
        if (value === 'initial')
        renderInitial();
      }
      if (path === 'networkErr') {
        if (value === 'networkErr') {
           const message = i18n.t(value)
           renderNetworkErr(message);
        } else if (value === 'RSSerr') {
            const message = i18n.t(value)
            renderNetworkErr(message);
        }
      }
  });

  const updateFeeds = (url) => {
        const proxyUrl = getProxingRequest(url);
        axios.get(proxyUrl)
        .then((response) => {
          const urlData = response.data.contents;
          const content = getParsedData(urlData);
          const {titelFeedText, posts} = content;
          const matchedId = watchedState.feedsList
          .filter((el) => el.titelFeedText === titelFeedText)
          .map((el) => el.feedId)
          .join('');
          const newPostsList = createPostList(posts, matchedId);
          const findNewPosts = _.differenceBy(newPostsList, state.postsList, matchedId);
          if (!!findNewPosts) {
            findNewPosts.forEach((newPost) => {
                watchedState.postsList.unshift(newPost)
            })
          }
        })
        .catch((err) => {
            if (err.request) {
            watchedState.networkErr = 'networkErr';
                return;
            }
        })
        .finally(() => {
            const timeInterval = 5000;
            setTimeout(() => updateFeeds(url), timeInterval);
          });
  };

  watchedState.processState = 'initial';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.formState = '';
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    watchedState.formData.inputLink = inputData;
    const feeds = watchedState.formData.formFeeds;
    watchedState.errorsKeys = [];
    watchedState.networkErr = null;
    urlValidation(
      inputData,
      feeds,
      () => {
        watchedState.formState = 'valid';
        watchedState.formData.formFeeds.push(inputData);
        const url = getProxingRequest(inputData);
        axios.get(url)
        .then((response) => {
            const urlData = response.data.contents;
            const content = getParsedData(urlData);
            const feedId = uniqueId();
            const {titelFeedText, descriptionFeedText, posts} = content;
            const postsList = createPostList(posts, feedId);
            watchedState.feedsList.push({feedId, titelFeedText, descriptionFeedText});
            watchedState.postsList = [...postsList, ...state.postsList];
            updateFeeds(inputData);
        })
        .catch((err) => {
            if (err.request) {
                watchedState.networkErr = 'networkErr';
                return;
              }
            watchedState.networkErr = 'RSSerr';
        });
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
      const state = {
        formState: '',
        formData: {
          inputLink: '',
          formFeeds: [],
        },
        feedsList: [],
        postsList: [],
        errorsKeys: [],
        networkErr: null,
        processState: 'filling',
      };
      app(i18n, state);
    })
    .catch((error) => {
      console.error('Ошибка инициализации i18n:', error);
    });
};

export default runApp;
