import { BoardPage } from '@pages/board';
import type { Metadata } from 'next';
import { getBoard } from '@features/board/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { boardId } = await params;
  
  try {
    const board = await getBoard(boardId);
    
    return {
      title: `${board.name} - CollaBoard`,
      description: board.description || '아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드',
      openGraph: {
        title: `${board.name} - CollaBoard`,
        description: board.description || '아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드',
        type: 'website',
      },
    };
  } catch {
    return {
      title: '보드 - CollaBoard',
      description: '아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드',
    };
  }
}

export default function Board() {
  return <BoardPage />;
}
