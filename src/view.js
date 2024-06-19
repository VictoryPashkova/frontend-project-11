const createInitialContainer = (containerClass) => {
  const container = document.querySelector(containerClass);
  const genDiv = document.createElement('div');
  genDiv.classList.add('card', 'border-0');
  const titleDiv = document.createElement('div');
  titleDiv.classList.add('card-body');
  const title = document.createElement('h2');
  title.classList.add('card-title', 'h4');
  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  container.append(genDiv);
  genDiv.append(titleDiv);
  titleDiv.append(title);
  genDiv.append(list);
};
const renderValidationSuccess = (successMessage) => {
  const input = document.querySelector('.form-control');
  const feedBackParagraf = document.querySelector('.feedback');
  feedBackParagraf.classList.add('text-success');
  feedBackParagraf.classList.remove('text-danger');
  feedBackParagraf.textContent = successMessage;
  input.classList.remove('is-invalid');
};

const renderValidationError = (err) => {
  const input = document.querySelector('.form-control');
  const feedBackParagraf = document.querySelector('.feedback');
  input.classList.add('is-invalid');
  feedBackParagraf.classList.add('text-success');
  feedBackParagraf.classList.add('text-danger');
  feedBackParagraf.textContent = err;
};

const renderFeedsList = (feeds, feedTitle) => {
  const container = document.querySelector('.feeds');
  const titelFeeds = container.querySelector('.card-title');
  const feedsList = container.querySelector('.list-group');
  titelFeeds.textContent = feedTitle;
  feedsList.innerHTML = '';

  feeds.forEach((feed) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');
    const feedItemTitel = document.createElement('h3');
    feedItemTitel.classList.add('h6', 'm-0');
    feedItemTitel.textContent = feed.title;
    const feedItemDescript = document.createElement('p');
    feedItemDescript.classList.add('m-0', 'small', 'text-black-50');
    feedItemDescript.textContent = feed.description;
    feedItem.append(feedItemTitel);
    feedItem.append(feedItemDescript);
    feedsList.append(feedItem);
  });
};

const createPostItem = (item, watchedPostsId, viewButtonText) => {
  const { url: postLink, name: postName, postId } = item;
  const post = document.createElement('li');
  post.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
  const postNameEl = document.createElement('a');
  postNameEl.setAttribute('href', postLink);
  postNameEl.classList.add('fw-bold');
  if (watchedPostsId) {
    if (watchedPostsId.includes(postId)) {
      post.classList.remove('fw-bold');
      postNameEl.classList.add('fw-normal', 'link-secondary');
    }
  }
  postNameEl.setAttribute('data-id', postId);
  postNameEl.setAttribute('target', '_blank');
  postNameEl.setAttribute('rel', 'noopener noreferrer');
  postNameEl.textContent = postName;
  const postButton = document.createElement('button');
  postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  postButton.setAttribute('type', 'button');
  postButton.setAttribute('data-id', postId);
  postButton.setAttribute('data-bs-toggle', 'modal');
  postButton.setAttribute('data-bs-target', '#modal');
  postButton.textContent = viewButtonText;
  return ({ post, postNameEl, postButton });
};

const renderPostsList = (posts, postTitle, viewButtonText, watchedPostsId) => {
  const container = document.querySelector('.posts');
  const titelPosts = container.querySelector('.card-title');
  const postsList = container.querySelector('.list-group');
  titelPosts.textContent = postTitle;
  postsList.innerHTML = '';

  posts.forEach((postItem) => {
    const {
      post,
      postNameEl,
      postButton,
    } = createPostItem(postItem, watchedPostsId, viewButtonText);
    post.append(postNameEl);
    post.append(postButton);
    postsList.append(post);
  });
};

const renderInitial = () => {
  createInitialContainer('.feeds');
  createInitialContainer('.posts');
};

const renderNetworkErr = (err) => {
  const feedBackParagraf = document.querySelector('.feedback');
  feedBackParagraf.classList.add('text-danger');
  feedBackParagraf.textContent = err;
};

const renderWatchedPosts = (ids) => {
  ids.forEach((id) => {
    const post = document.querySelector(`[data-id="${id}"]`);
    post.classList.remove('fw-bold');
    post.classList.add('fw-normal', 'link-secondary');
  });
};

const renderModal = (id, posts) => {
  const post = document.querySelector(`[data-id="${id}"]`);
  const modalPostName = post.textContent;
  const postAtrib = [];
  posts.forEach((item) => {
    const { url, description } = item;
    if (String(item.name) === String(modalPostName)) {
      postAtrib.push(description, url);
    }
  });
  const [postDescription, postLink] = postAtrib;
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = modalPostName;
  const modalBody = document.querySelector('.modal-body');
  modalBody.textContent = postDescription;
  const modalLink = document.querySelector('.full-article');
  modalLink.removeAttribute('href');
  modalLink.setAttribute('href', postLink);
};

export {
  renderValidationSuccess,
  renderValidationError,
  renderFeedsList,
  renderPostsList,
  renderInitial,
  renderNetworkErr,
  renderWatchedPosts,
  renderModal,
};
