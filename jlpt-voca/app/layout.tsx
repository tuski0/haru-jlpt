import './style.css';
export const metadata = { title: '하루 단어', description: 'JLPT 단어 학습' };
export default function Layout({children}: {children: React.ReactNode}) { return <html lang="ko"><body>{children}</body></html>; }
