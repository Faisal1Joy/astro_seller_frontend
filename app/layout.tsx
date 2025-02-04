import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Layout from './components/Layout';

export const metadata: Metadata = {
  title: 'Bazar - Your Dashboard',
  description: 'A modern dashboard application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
} 