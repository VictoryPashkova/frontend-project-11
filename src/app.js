import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
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
import getParsedData from './parser.js';

const getProxingRequest = (url) => {
  const allOriginsHexletUrl = new URL('https://allorigins.hexlet.app/get');
  allOriginsHexletUrl.searchParams.set('disableCache', 'true');
  allOriginsHexletUrl.searchParams.set('url', url);
  return allOriginsHexletUrl.toString();
};

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

const createPostList = (posts, feedId = null) => {
  const newPostsList = [];
  posts.posts.forEach((item) => {
    const postId = _.uniqueId();
    item.unshift(feedId);
    item.push(postId);
    newPostsList.push(item);
  });
  return newPostsList;
};

const createFeedsList = (feed) => {
  const feedId = _.uniqueId();
  return { feedId, ...feed };
};

const app = (i18n, state) => {
  const form = document.querySelector('.rss-form');
  const input = document.querySelector('.form-control');
  const modal = document.getElementById('modal');

  const checkValidation = (value, errKey) => {
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
    if (path === 'form.formState') {
      const errKey = watchedState.form.error[0];
      checkValidation(value, errKey);
    } else if (path === 'feedsList') {
      const feedTitle = i18n.t('feedTitle');
      renderFeedsList(value, feedTitle);
    } else if (path === 'postsList') {
      const viewButtonText = i18n.t('viewButtonText');
      const postTitle = i18n.t('postTitle');
      renderPostsList(value, postTitle, viewButtonText, state.uiState.watchedPostsId);
    } else if (path === 'loading.error') {
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
    watchedState.form.error = [];
    watchedState.loading.error = null;
    watchedState.uiState.activeModalPostId = null;
    watchedState.form.formState = 'initial';
  };

  const updatePostsFeedsState = (feeds, posts) => {
    watchedState.feedsList.push(feeds);
    watchedState.postsList = [...posts, ...state.postsList];
  };

  const updateFormState = (err) => {
    watchedState.form.error.push(err);
    watchedState.form.formState = 'invalid';
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

  const fetchData = (url) => {
    const proxyUrl = getProxingRequest(url);
    return axios.get(proxyUrl)
      .then((response) => {
        watchedState.loading.status = 'processing';
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
        watchedState.loading.status = 'failed';
        if (err.request) {
          watchedState.loading.error = 'networkErr';
        }
        console.error(err);
      });
  };

  const updateFeeds = (feeds) => {
    const promises = feeds.map((url) => fetchData(url));

    Promise.all(promises)
      .then(() => {
        watchedState.loading.status = 'processed';
        const timeInterval = 5000;
        setTimeout(() => {
          updateFeeds(feeds);
        }, timeInterval);
      }).catch((err) => {
        watchedState.loading.status = 'failed';
        watchedState.loading.error = `Ошибка обновления: ${err}`;
        throw new Error(err);
      });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputUrl = formData.get('url');
    const feeds = state.feedsList.map((feed) => feed.feedLink);
    resetState();
    validateUrl(
      inputUrl,
      feeds,
      () => {
        feeds.push(inputUrl);
        const url = getProxingRequest(inputUrl);
        axios.get(url)
          .then((response) => {
            watchedState.loading.status = 'processing';
            const urlData = response.data.contents;
            const content = getParsedData(urlData, inputUrl);
            const feedsList = createFeedsList(content.feed);
            const postsList = createPostList(content.posts, feedsList.feedId);
            updatePostsFeedsState(feedsList, postsList);
            updateFeeds(feeds);
            watchedState.form.formState = 'valid';
            watchedState.loading.status = 'processed';
          })
          .catch((err) => {
            watchedState.loading.status = 'failed';
            if (err.request) {
              watchedState.loading.error = 'networkErr';
              return;
            }
            watchedState.loading.error = 'RSSerr';
          });
        form.reset();
        input.focus();
      },
      (err) => {
        updateFormState(err.key);
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
  form: {
    formState: 'initial',
    error: [],
  },
  feedsList: [],
  postsList: [],
  loading: {
    status: 'waiting',
    error: null,
  },
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
      renderInitial();
    })
    .catch((error) => {
      console.error('Ошибка инициализации i18n:', error);
    });
};

export default runApp;
