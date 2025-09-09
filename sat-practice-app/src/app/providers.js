'use client';

import { PostHogProvider } from '../components/PostHogProvider';

export default function Providers({ children }) {
  return (
    <PostHogProvider>
      {children}
    </PostHogProvider>
  );
}