'use client';

import { supabase } from '@shared/api';

const BUCKET_NAME = 'board-images';

/**
 * 이미지를 Supabase Storage에 업로드
 */
export async function uploadImage(
  file: File,
  boardId: string,
  elementId: string
): Promise<string> {
  // 파일 확장자 추출
  const fileExt = file.name.split('.').pop();
  const fileName = `${boardId}/${elementId}.${fileExt}`;

  // Storage에 업로드
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false, // 기존 파일이 있으면 에러
    });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // 공개 URL 가져오기
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    throw new Error('이미지 URL을 가져올 수 없습니다.');
  }

  return urlData.publicUrl;
}

/**
 * Storage에서 이미지 삭제
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  // URL에서 파일 경로 추출
  // 예: https://xxx.supabase.co/storage/v1/object/public/board-images/board-id/element-id.jpg
  const urlParts = imageUrl.split('/');
  const fileName = urlParts.slice(-2).join('/'); // board-id/element-id.jpg

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileName]);

  if (error) {
    console.warn('이미지 삭제 실패 (무시됨):', error);
    // 삭제 실패해도 에러를 throw하지 않음 (이미 DB에서 삭제된 경우 등)
  }
}

