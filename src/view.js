import uniqueId from 'lodash/uniqueId.js';

const createInintialFeedsContainer = () => {
    const feedsListContainer = document.querySelector('.feeds');
    const genFeedsDiv = document.createElement('div');
    genFeedsDiv.classList.add('card', 'border-0');
    const titelFeedsDiv = document.createElement('div');
    titelFeedsDiv.classList.add('card-body');
    const titelFeeds = document.createElement('h2');
    titelFeeds.classList.add('card-title', 'h4');
    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'rounded-0');
    feedsListContainer.append(genFeedsDiv);
    genFeedsDiv.append(titelFeedsDiv);
    genFeedsDiv.append(feedsList);
    titelFeedsDiv.append(titelFeeds);
};

const createInintialPostsContainer = () => {
    const postsContainer = document.querySelector('.posts');
    const genPostsDiv = document.createElement('div');
    genPostsDiv.classList.add('card', 'border-0');
    const titelPostsDiv = document.createElement('div');
    titelPostsDiv.classList.add('card-body');
    const titelPosts = document.createElement('h2');
    titelPosts.classList.add('card-title', 'h4');
    const postsList = document.createElement('ul');
    postsList.classList.add('list-group', 'border-0', 'rounded-0');
    postsContainer.append(genPostsDiv);
    genPostsDiv.append(titelPostsDiv);
    titelPostsDiv.append(titelPosts);
    genPostsDiv.append(postsList);
};
const renderIsValid = (successMessage) => {
    const input = document.querySelector('.form-control');
    const feedBackParagraf = document.querySelector('.feedback');
    feedBackParagraf.classList.add('text-success');
    feedBackParagraf.classList.remove('text-danger');
    feedBackParagraf.textContent = successMessage;
    input.classList.remove('is-invalid');
};

const renderNotValid = (err) => {
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
        feedItemTitel.textContent = feed.titelFeedText;
        const feedItemDescript = document.createElement('p');
        feedItemDescript.classList.add('m-0', 'small', 'text-black-50');
        feedItemDescript.textContent = feed.descriptionFeedText;
        feedItem.append(feedItemTitel);
        feedItem.append(feedItemDescript);
        feedsList.append(feedItem);
    })
};

const renderPostsList = (posts, postTitle, viewButtonText) => {
  const container = document.querySelector('.posts');
  const titelPosts = container.querySelector('.card-title');
  const postsList = container.querySelector('.list-group');
  titelPosts.textContent = postTitle;
  postsList.innerHTML = '';
  
  posts.forEach((postItem) => {
    const [id, postLink, postName] = postItem;
    const post = document.createElement('li');
    post.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const postNameEl = document.createElement('a');
    const dataId = uniqueId();
    postNameEl.setAttribute('href', postLink);
    postNameEl.classList.add('fw-bold');
    postNameEl.setAttribute('data-id', dataId);
    postNameEl.setAttribute('target', '_blank');
    postNameEl.setAttribute('rel', 'noopener noreferrer');
    postNameEl.textContent = postName;
    const postButton = document.createElement('button');
    postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    postButton.setAttribute('type', 'button');
    postButton.setAttribute('data-id', dataId);
    postButton.setAttribute('data-bs-toggle', 'modal');
    postButton.setAttribute('data-bs-target', '#modal');
    postButton.textContent = viewButtonText;
    post.append(postNameEl);
    post.append(postButton);
    postsList.append(post);
  });  
};

const renderInitial = () => {
    createInintialFeedsContainer();
    createInintialPostsContainer();
};

const renderNetworkErr = (err) => {
    const feedBackParagraf = document.querySelector('.feedback');
    feedBackParagraf.textContent = err;
}

export {renderIsValid, renderNotValid, renderFeedsList, renderPostsList, renderInitial, renderNetworkErr};
