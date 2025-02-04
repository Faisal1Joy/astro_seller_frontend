import { Toaster } from 'react-hot-toast';
import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <Navigation />
      <main>{children}</main>
    </div>
  );
} 