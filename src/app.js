import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import {
  renderValidationSuccess,
  renderValidationError,
  renderFeedsList,
  renderPostsList,
  renderInitial,
  renderNetworkErr,
  renderWatchedPosts,
  renderModal,
} from './view.js';
import resources from './locales/index.js';
import getParsedData from './parser.js';

const createProxyUrl = (url) => {
  const allOriginsHexletUrl = new URL('https://allorigins.hexlet.app/get');
  allOriginsHexletUrl.searchParams.set('disableCache', 'true');
  allOriginsHexletUrl.searchParams.set('url', url);
  return allOriginsHexletUrl.toString();
};

const validateUrl = (url, feeds, valid, invalid) => {
  const urlSchema = yup.string().url().notOneOf(feeds);
  return urlSchema.validate(url)
    .then(() => valid())
    .catch((error) => {
      invalid(error.errors[0]);
    });
};

const addIdsToPosts = (posts, postsList, feedId = null) => {
  const ids = postsList.map((post) => post.postId);
  let id;
  const postList = posts.map((post) => {
    id = _.uniqueId();
    if (ids.includes(id)) {
      id = _.uniqueId();
    }
    return { postId: id, feedId, ...post };
  });
  return postList;
};

const addIdToFeed = (feed) => {
  const feedId = _.uniqueId();
  return { feedId, ...feed };
};

const initializeApp = (i18n, state) => {
  const form = document.querySelector('.rss-form');
  const input = document.querySelector('.form-control');
  const modal = document.getElementById('modal');
  const timeInterval = 5000;

  const checkValidation = (value, errKey) => {
    if (value === 'valid') {
      const successMessage = i18n.t('successLoadedRSS');
      renderValidationSuccess(successMessage);
    } else if (value === 'invalid') {
      const errMessage = i18n.t(errKey);
      renderValidationError(errMessage);
    }
  };

  const handleError = (value) => {
    if (value === 'networkErr') {
      const networMessage = i18n.t(value);
      renderNetworkErr(networMessage);
    } else if (value === 'RSSerr') {
      const rssErrMessage = i18n.t(value);
      renderNetworkErr(rssErrMessage);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.formState':
        checkValidation(value, watchedState.form.error[0]);
        break;
      case 'feedsList':
        renderFeedsList(value, i18n.t('feedTitle'));
        break;
      case 'postsList':
        renderPostsList(value, i18n.t('postTitle'), i18n.t('viewButtonText'), state.uiState.watchedPostsId);
        break;
      case 'loading.error':
        handleError(value);
        break;
      case 'uiState.watchedPostsId':
        renderWatchedPosts(value);
        break;
      case 'uiState.activeModalPostId':
        if (value !== null) {
          renderModal(value, state.postsList);
        }
        break;
      default:
        break;
    }
  });

  const resetState = () => {
    watchedState.form.error = [];
    watchedState.loading.error = null;
    watchedState.uiState.activeModalPostId = null;
    watchedState.form.formState = 'initial';
  };

  const updatePostsFeedState = (feeds, posts) => {
    watchedState.feedsList.push(feeds);
    watchedState.postsList = [...posts, ...state.postsList];
  };

  const updateFormState = (err) => {
    watchedState.form.error.push(err);
    watchedState.form.formState = 'invalid';
  };

  const findNotMatchedPosts = (newPostsList, existingPostsList, matchedId) => {
    const isUniqueByUrl = (post, postsList) => postsList
      .every((existingPost) => post.url !== existingPost.url);
    const notMatchedPosts = newPostsList.filter((newPost) => {
      if (newPost.feedId !== matchedId) {
        return false;
      }
      return isUniqueByUrl(newPost, existingPostsList);
    });
    return notMatchedPosts;
  };

  const findNewPosts = (content) => {
    const { feed, posts } = content;
    const matchedId = watchedState.feedsList
      .find((el) => el.title === feed.title)?.feedId ?? null;
    const newPostsList = addIdsToPosts(posts, state.postsList, matchedId);
    const newPosts = findNotMatchedPosts(newPostsList, state.postsList, matchedId);
    return newPosts;
  };

  const fetchData = (url) => {
    const proxyUrl = createProxyUrl(url);
    return axios.get(proxyUrl)
      .then((response) => {
        const urlData = response.data.contents;
        const content = getParsedData(urlData);
        const newPosts = findNewPosts(content);
        watchedState.postsList.unshift(...(newPosts ?? []));
      })
      .catch((err) => {
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
        setTimeout(() => {
          updateFeeds(watchedState.feedsList.map((feed) => feed.feedLink));
        }, timeInterval);
      }).catch((err) => {
        console.error(err);
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
        const url = createProxyUrl(inputUrl);
        axios.get(url)
          .then((response) => {
            const urlData = response.data.contents;
            const content = getParsedData(urlData, inputUrl);
            const feedsList = addIdToFeed(content.feed);
            const postsList = addIdsToPosts(content.posts, state.postsList, feedsList.feedId);
            updatePostsFeedState(feedsList, postsList);
            watchedState.form.formState = 'valid';
          })
          .catch((err) => {
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

    const runConstantlyFeedsUpdate = () => {
      setTimeout(() => {
        updateFeeds(watchedState.feedsList.map((feed) => feed.feedLink));
      }, timeInterval);
    };

    runConstantlyFeedsUpdate();
  });

  modal.addEventListener('show.bs.modal', (e) => {
    const modalBtn = e.relatedTarget;
    const modalPostId = modalBtn.getAttribute('data-id');
    if (!modalPostId || watchedState.uiState.watchedPostsId.includes(modalPostId)) {
      return;
    }
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
    error: null,
  },
  uiState: {
    watchedPostsId: [],
    activeModalPostId: null,
  },
});

const setYupLocale = () => {
  yup.setLocale({
    string: {
      url: () => ({ key: 'errorInvalidUrl' }),
    },
    mixed: {
      notOneOf: () => ({ key: 'errorDoubUrl' }),
    },
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
      const state = initializeAppState();
      initializeApp(i18n, state);
      renderInitial();
      setYupLocale();
    })
    .catch((err) => {
      console.error(err);
    });
};

export default runApp;
