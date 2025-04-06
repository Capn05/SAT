export const dynamic = 'force-static';

export default function Home() {
  // This is a dummy component that won't be rendered
  // because the middleware will intercept the request 
  // and serve the static HTML file directly
  return null;
}