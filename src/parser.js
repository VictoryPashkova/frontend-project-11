const getParsedData = (responseData) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(responseData, 'application/xml');

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Ошибка парсинга');
  }
  const channel = doc.querySelector('channel');

  const titelFeedText = channel.querySelector('title').innerHTML;
  const descriptionFeedText = channel.querySelector('description').innerHTML;
  const posts = channel.querySelectorAll('item');

  return { titelFeedText, descriptionFeedText, posts: { posts } };
};

export default getParsedData;
