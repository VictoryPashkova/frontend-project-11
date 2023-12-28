import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import uniqueId from 'lodash/uniqueId.js';
import {
  renderIsValid,
  renderIsNotValid,
  renderFeedsList,
  renderPostsList,
  renderInitial,
  renderNetworkErr,
  renderWatchedPosts,
  renderModal,
} from './view.js';
import resources from './locales/index.js';
import { getProxingRequest, getParsedData } from './parser.js';

yup.setLocale({
  string: {
    url: () => ({ key: 'errorInvalidUrl' }),
  },
  mixed: {
    notOneOf: () => ({ key: 'errorDoubUrl' }),
  },
});

const validateUrl = (url, feeds, valid, invalid) => {
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
    const postId = uniqueId();
    const postName = item.querySelector('title').textContent;
    const postLink = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    postsList.push([feedId, postLink, postName, postDescription, postId]);
  });
  return postsList;
};

const createFeedsList = (content) => {
  const feedId = uniqueId();
  const { titelFeedText, descriptionFeedText } = content;
  return { feedId, titelFeedText, descriptionFeedText };
};

const app = (i18n, state) => {
  const form = document.querySelector('.rss-form');
  const input = document.querySelector('.form-control');
  const modal = document.getElementById('modal');

  const renderValidation = (value, errKey) => {
    if (value === 'valid') {
      const successMessage = i18n.t('successLoadedRSS');
      renderIsValid(successMessage);
    } else if (value === 'invalid') {
      const errMessage = i18n.t(errKey);
      renderIsNotValid(errMessage);
    }
  };

  const renderErr = (value) => {
    if (value === 'networkErr') {
      const networMessage = i18n.t(value);
      renderNetworkErr(networMessage);
    } else if (value === 'RSSerr') {
      const rssErrMessage = i18n.t(value);
      renderNetworkErr(rssErrMessage);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'formState') {
      const errKey = watchedState.errorsKeys[0];
      renderValidation(value, errKey);
    } else if (path === 'feedsList') {
      const feedTitle = i18n.t('feedTitle');
      renderFeedsList(value, feedTitle);
    } else if (path === 'postsList') {
      const viewButtonText = i18n.t('viewButtonText');
      const postTitle = i18n.t('postTitle');
      renderPostsList(value, postTitle, viewButtonText, state.uiState.watchedPostsId);
    } else if (path === 'processState') {
      if (value === 'initial') {
        renderInitial();
      }
    } else if (path === 'networkErr') {
      renderErr(value);
    } else if (path === 'uiState.watchedPostsId') {
      renderWatchedPosts(value);
    } else if (path === 'uiState.activeModalPostId') {
      if (value !== null) {
        renderModal(value, state.postsList);
      }
    }
  });

  const resetState = () => {
    watchedState.errorsKeys = [];
    watchedState.networkErr = null;
    watchedState.uiState.activeModalPostId = null;
    watchedState.formState = '';
  };

  const updatePostsFeedsState = (feeds, posts) => {
    watchedState.feedsList.push(feeds);
    watchedState.postsList = [...posts, ...state.postsList];
  };

  const updateStateErr = (err) => {
    watchedState.errorsKeys.push(err);
    watchedState.formState = 'invalid';
  };

  const findNewPost = (content) => {
    const { titelFeedText, posts } = content;
    const matchedId = watchedState.feedsList
      .filter((el) => el.titelFeedText === titelFeedText)
      .map((el) => el.feedId)
      .join('');
    const newPostsList = createPostList(posts, matchedId);
    const newPosts = _.differenceBy(newPostsList, state.postsList, matchedId);
    return newPosts;
  };

  const updateFeeds = (url) => {
    const proxyUrl = getProxingRequest(url);
    axios.get(proxyUrl)
      .then((response) => {
        const urlData = response.data.contents;
        const content = getParsedData(urlData);
        const newPosts = findNewPost(content);
        if (newPosts) {
          newPosts.forEach((newPost) => {
            watchedState.postsList.unshift(newPost);
          });
        }
      })
      .catch((err) => {
        if (err.request) {
          watchedState.networkErr = 'networkErr';
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
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    watchedState.formData.inputLink = inputData;
    const feeds = watchedState.formData.formFeeds;
    resetState();
    validateUrl(
      inputData,
      feeds,
      () => {
        watchedState.formData.formFeeds.push(inputData);
        const url = getProxingRequest(inputData);
        axios.get(url)
          .then((response) => {
            const urlData = response.data.contents;
            const content = getParsedData(urlData);
            const feedsList = createFeedsList(content);
            const postsList = createPostList(content.posts, feedsList.feedId);
            updatePostsFeedsState(feedsList, postsList);
            updateFeeds(inputData);
            watchedState.formState = 'valid';
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
        updateStateErr(err.key);
        form.reset();
        input.focus();
      },
    );
  });

  modal.addEventListener('show.bs.modal', (e) => {
    const modalBtn = e.relatedTarget;
    const modalPostId = modalBtn.getAttribute('data-id');
    watchedState.uiState.watchedPostsId.push(modalPostId);
    watchedState.uiState.activeModalPostId = modalPostId;
  });
};

const initializeAppState = () => ({
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
  uiState: {
    watchedPostsId: [],
    activeModalPostId: null,
  },
});

const runApp = () => {
  const i18n = i18next.createInstance({
    lng: 'ru',
    resources,
  });
  i18n
    .init()
    .then(() => {
      const state = initializeAppState();
      app(i18n, state);
    })
    .catch((error) => {
      console.error('Ошибка инициализации i18n:', error);
    });
};

export default runApp;
