import MyDownloadsClient from './MyDownloadsClient';

// Private utility page: not for search engines
export const metadata = {
  title: 'My Downloads',
  robots: { index: false, follow: true },
};

export default function MyDownloadsPage() {
  return <MyDownloadsClient />;
}
