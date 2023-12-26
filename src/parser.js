const getProxingRequest = (url) => {
    const allOriginsHexletUrl = new URL('https://allorigins.hexlet.app/get');
    allOriginsHexletUrl.searchParams.set('disableCache', 'true');
    allOriginsHexletUrl.searchParams.set('url', url);
    return allOriginsHexletUrl.toString();
  };

const getParsedData = (responseData) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseData, 'application/xml');

    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
        console.error('Ошибка парсинга:', errorNode);
    }
    const channel = doc.querySelector('channel');

    const titelFeed = channel.querySelector('title').innerHTML;
    const titelFeedText = titelFeed.substring(9, titelFeed.length - 3);
    const descriptionFeed = channel.querySelector('description').innerHTML;
    const descriptionFeedText = descriptionFeed.substring(9, descriptionFeed.length - 3);
    const posts = channel.querySelectorAll('item');

    return {titelFeedText, descriptionFeedText, posts: {posts}};
};

export { getProxingRequest, getParsedData };