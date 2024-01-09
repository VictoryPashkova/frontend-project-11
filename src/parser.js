const getPosts = (postsData) => {
  const postsInfo = [];
  postsData.forEach((item) => {
    const postName = item.querySelector('title').textContent;
    const postLink = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    postsInfo.push([postLink, postName, postDescription]);
  });
  return postsInfo;
};

const getFeeds = (titelFeedText, descriptionFeedText, feedLink) => ({
  title: titelFeedText,
  description: descriptionFeedText,
  feedLink,
});

const getParsedData = (responseData, feedLink) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(responseData, 'application/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error(errorNode);
  }
  const channel = doc.querySelector('channel');
  const titelFeedText = channel.querySelector('title').innerHTML;
  const descriptionFeedText = channel.querySelector('description').innerHTML;
  const postsData = channel.querySelectorAll('item');
  const feed = getFeeds(titelFeedText, descriptionFeedText, feedLink);
  const posts = getPosts(postsData);

  return { feed, posts: { posts } };
};

export default getParsedData;
