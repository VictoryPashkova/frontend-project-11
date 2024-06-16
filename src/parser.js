const getPosts = (postsData) => {
  const postsInfo = [];
  postsData.forEach((item) => {
    const name = item.querySelector('title').textContent;
    const url = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;
    postsInfo.push({ url, name, description });
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
    const error = new Error(errorNode.textContent);
    error.isParseError = true;
    throw error;
  }

  const channel = doc.querySelector('channel');
  const titelFeedText = channel.querySelector('title').innerHTML;
  const descriptionFeedText = channel.querySelector('description').innerHTML;
  const postsData = channel.querySelectorAll('item');
  const feed = getFeeds(titelFeedText, descriptionFeedText, feedLink);
  const posts = getPosts(postsData);

  return { feed, posts };
};

export default getParsedData;
