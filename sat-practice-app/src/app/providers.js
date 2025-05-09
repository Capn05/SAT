'use client';

import { AuthProvider } from '../../lib/AuthProvider';
import { PostHogProvider } from '../components/PostHogProvider';

export default function Providers({ children }) {
  return (
    <PostHogProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PostHogProvider>
  );
}