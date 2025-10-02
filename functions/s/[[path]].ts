export const onRequest: PagesFunction = async (context) => {
  // Serve the session.html file from the public directory
  const url = new URL('/session.html', context.request.url);
  const response = await context.env.ASSETS.fetch(url);
  return response;
};
